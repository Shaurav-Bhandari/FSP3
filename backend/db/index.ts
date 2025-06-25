'use strict'
const { EventEmitter } = require('events');
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const NOOP = function () {}

const removeWhere = <T>(list: T[], predicate: (item: T) => boolean): T | undefined => {
  const i = list.findIndex(predicate)
  return i === -1 ? undefined : list.splice(i, 1)[0]
}

class IdleItem {
  constructor(
    public client: any,
    public idleListener: (err: any) => void,
    public timeoutId: NodeJS.Timeout | undefined
  ) {}
}

class PendingItem {
  public timedOut?: boolean;
  
  constructor(public callback: (err?: any, client?: any, release?: () => void) => void) {}
}

function throwOnDoubleRelease(): never {
  throw new Error('Release called on client which has already been released to the pool.')
}

function promisify(Promise: any, callback?: any): { callback: any; result: any } {
  if (callback) {
    return { callback: callback, result: undefined }
  }
  let rej: (err: any) => void
  let res: (client: any) => void
  const cb = function (err: any, client: any) {
    err ? rej(err) : res(client)
  }
  const result = new Promise(function (resolve, reject) {
    res = resolve
    rej = reject
  }).catch((err: any) => {
    // replace the stack trace that leads to `TCP.onStreamRead` with one that leads back to the
    // application that created the query
    if (Error.captureStackTrace && typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(err)
    }
    throw err
  })
  return { callback: cb, result: result }
}

function makeIdleListener(pool: Pool, client: any): (err: any) => void {
  return function idleListener(err: any) {
    err.client = client

    client.removeListener('error', idleListener)
    client.on('error', () => {
      pool.log('additional client error after disconnection due to error', err)
    })
    pool._remove(client)
    // TODO - document that once the pool emits an error
    // the client has already been closed & purged and is unusable
    pool.emit('error', err, client)
  }
}

interface PoolOptions {
  max?: number;
  min?: number;
  poolSize?: number;
  maxUses?: number;
  allowExitOnIdle?: boolean;
  maxLifetimeSeconds?: number;
  log?: (...args: any[]) => void;
  Client?: any;
  Promise?: any;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  password?: string;
  ssl?: {
    key?: string;
    [key: string]: any;
  };
  verify?: (client: any, callback: (err?: any) => void) => void;
  [key: string]: any;
}

class Pool extends EventEmitter {
  public options: PoolOptions;
  public log: (...args: any[]) => void;
  public Client: any;
  public Promise: any;
  public ending: boolean = false;
  public ended: boolean = false;
  
  private _clients: any[] = [];
  private _idle: IdleItem[] = [];
  private _expired: WeakSet<any> = new WeakSet();
  private _pendingQueue: PendingItem[] = [];
  private _endCallback: (() => void) | undefined;

  constructor(options: PoolOptions = {}, Client?: any) {
    super()
    this.options = Object.assign({}, options)

    if (options != null && 'password' in options) {
      // "hiding" the password so it doesn't show up in stack traces
      // or if the client is console.logged
      Object.defineProperty(this.options, 'password', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: options.password,
      })
    }
    if (options != null && options.ssl && options.ssl.key) {
      // "hiding" the ssl->key so it doesn't show up in stack traces
      // or if the client is console.logged
      Object.defineProperty(this.options.ssl, 'key', {
        enumerable: false,
      })
    }

    this.options.max = this.options.max || this.options.poolSize || 10
    this.options.min = this.options.min || 0
    this.options.maxUses = this.options.maxUses || Infinity
    this.options.allowExitOnIdle = this.options.allowExitOnIdle || false
    this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0
    this.log = this.options.log || function () {}
    this.Client = this.options.Client || Client || require('pg').Client
    this.Promise = this.options.Promise || global.Promise

    if (typeof this.options.idleTimeoutMillis === 'undefined') {
      this.options.idleTimeoutMillis = 10000
    }

    // Add connection success logging
    this.on('connect', (client: any) => {
      console.log('✅ PostgreSQL client connected successfully');
      console.log(`📊 Pool stats - Total: ${this.totalCount}, Idle: ${this.idleCount}, Waiting: ${this.waitingCount}`);
      this.log('New client connected to pool', {
        totalClients: this.totalCount,
        idleClients: this.idleCount,
        waitingRequests: this.waitingCount
      });
    });

    this.on('acquire', (client: any) => {
      console.log('🔓 Client acquired from pool');
      this.log('Client acquired from pool');
    });

    this.on('release', (err: any, client: any) => {
      if (err) {
        console.log('❌ Client released with error:', err.message);
      } else {
        console.log('🔒 Client released back to pool');
      }
      this.log('Client released', { error: err?.message });
    });

    this.on('remove', (client: any) => {
      console.log('🗑️ Client removed from pool');
      console.log(`📊 Pool stats - Total: ${this.totalCount}, Idle: ${this.idleCount}, Waiting: ${this.waitingCount}`);
      this.log('Client removed from pool');
    });
  }

  private _isFull(): boolean {
    return this._clients.length >= this.options.max!
  }

  private _isAboveMin(): boolean {
    return this._clients.length > this.options.min!
  }

  private _pulseQueue(): void {
    this.log('pulse queue')
    if (this.ended) {
      this.log('pulse queue ended')
      return
    }
    if (this.ending) {
      this.log('pulse queue on ending')
      if (this._idle.length) {
        this._idle.slice().map((item) => {
          this._remove(item.client)
        })
      }
      if (!this._clients.length) {
        this.ended = true
        this._endCallback?.()
      }
      return
    }

    // if we don't have any waiting, do nothing
    if (!this._pendingQueue.length) {
      this.log('no queued requests')
      return
    }
    // if we don't have any idle clients and we have no more room do nothing
    if (!this._idle.length && this._isFull()) {
      return
    }
    const pendingItem = this._pendingQueue.shift()!
    if (this._idle.length) {
      const idleItem = this._idle.pop()!
      if (idleItem.timeoutId) {
        clearTimeout(idleItem.timeoutId)
      }
      const client = idleItem.client
      client.ref && client.ref()
      const idleListener = idleItem.idleListener

      return this._acquireClient(client, pendingItem, idleListener, false)
    }
    if (!this._isFull()) {
      return this.newClient(pendingItem)
    }
    throw new Error('unexpected condition')
  }

  public _remove(client: any): void {
    const removed = removeWhere(this._idle, (item) => item.client === client)

    if (removed !== undefined && removed.timeoutId) {
      clearTimeout(removed.timeoutId)
    }

    this._clients = this._clients.filter((c) => c !== client)
    client.end()
    this.emit('remove', client)
  }

  public connect(cb?: (err?: any, client?: any, release?: () => void) => void): any {
    if (this.ending) {
      const err = new Error('Cannot use a pool after calling end on the pool')
      console.log('❌ Pool connection attempt failed: Pool is ending');
      return cb ? cb(err) : this.Promise.reject(err)
    }

    console.log('🔄 Attempting to connect to PostgreSQL...');
    const response = promisify(this.Promise, cb)
    const result = response.result

    // if we don't have to connect a new client, don't do so
    if (this._isFull() || this._idle.length) {
      // if we have idle clients schedule a pulse immediately
      if (this._idle.length) {
        process.nextTick(() => this._pulseQueue())
      }

      if (!this.options.connectionTimeoutMillis) {
        this._pendingQueue.push(new PendingItem(response.callback))
        return result
      }

      const queueCallback = (err?: any, res?: any, done?: () => void) => {
        clearTimeout(tid)
        response.callback(err, res, done)
      }

      const pendingItem = new PendingItem(queueCallback)

      // set connection timeout on checking out an existing client
      const tid = setTimeout(() => {
        // remove the callback from pending waiters because
        // we're going to call it with a timeout error
        removeWhere(this._pendingQueue, (i) => i.callback === queueCallback)
        pendingItem.timedOut = true
        console.log('⏰ Connection timeout exceeded');
        response.callback(new Error('timeout exceeded when trying to connect'))
      }, this.options.connectionTimeoutMillis)

      if ((tid as any).unref) {
        (tid as any).unref()
      }

      this._pendingQueue.push(pendingItem)
      return result
    }

    this.newClient(new PendingItem(response.callback))

    return result
  }

  public newClient(pendingItem: PendingItem): void {
    console.log('🆕 Creating new PostgreSQL client...');
    const client = new this.Client(this.options)
    this._clients.push(client)
    const idleListener = makeIdleListener(this, client)

    this.log('checking client timeout')

    // connection timeout logic
    let tid: NodeJS.Timeout | undefined
    let timeoutHit = false
    if (this.options.connectionTimeoutMillis) {
      tid = setTimeout(() => {
        console.log('⏰ Client connection timeout - ending client');
        this.log('ending client due to timeout')
        timeoutHit = true
        // force kill the node driver, and let libpq do its teardown
        client.connection ? client.connection.stream.destroy() : client.end()
      }, this.options.connectionTimeoutMillis)
    }

    this.log('connecting new client')
    client.connect((err: any) => {
      if (tid) {
        clearTimeout(tid)
      }
      client.on('error', idleListener)
      if (err) {
        console.log('❌ Client failed to connect:', err.message);
        this.log('client failed to connect', err)
        // remove the dead client from our list of clients
        this._clients = this._clients.filter((c) => c !== client)
        if (timeoutHit) {
          err = new Error('Connection terminated due to connection timeout', { cause: err })
        }

        // this client won't be released, so move on immediately
        this._pulseQueue()

        if (!pendingItem.timedOut) {
          pendingItem.callback(err, undefined, NOOP)
        }
      } else {
        console.log('✅ New PostgreSQL client connected successfully!');
        this.log('new client connected')

        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log('ending client due to expired lifetime')
            this._expired.add(client)
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client)
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err, client, clientRelease) => clientRelease?.()),
                idleListener,
                false
              )
            }
          }, this.options.maxLifetimeSeconds! * 1000)

          ;(maxLifetimeTimeout as any).unref?.()
          client.once('end', () => clearTimeout(maxLifetimeTimeout))
        }

        return this._acquireClient(client, pendingItem, idleListener, true)
      }
    })
  }

  // acquire a client for a pending work item
  private _acquireClient(client: any, pendingItem: PendingItem, idleListener: (err: any) => void, isNew: boolean): void {
    if (isNew) {
      this.emit('connect', client)
    }

    this.emit('acquire', client)

    client.release = this._releaseOnce(client, idleListener)

    client.removeListener('error', idleListener)

    if (!pendingItem.timedOut) {
      if (isNew && this.options.verify) {
        this.options.verify(client, (err?: any) => {
          if (err) {
            console.log('❌ Client verification failed:', err.message);
            client.release(err)
            return pendingItem.callback(err, undefined, NOOP)
          }

          console.log('✅ Client verification successful');
          pendingItem.callback(undefined, client, client.release)
        })
      } else {
        pendingItem.callback(undefined, client, client.release)
      }
    } else {
      if (isNew && this.options.verify) {
        this.options.verify(client, client.release)
      } else {
        client.release()
      }
    }
  }

  // returns a function that wraps _release and throws if called more than once
  private _releaseOnce(client: any, idleListener: (err: any) => void): (err?: any) => void {
    let released = false

    return (err?: any) => {
      if (released) {
        throwOnDoubleRelease()
      }

      released = true
      this._release(client, idleListener, err)
    }
  }

  // release a client back to the poll, include an error
  // to remove it from the pool
  private _release(client: any, idleListener: (err: any) => void, err?: any): void {
    client.on('error', idleListener)

    client._poolUseCount = (client._poolUseCount || 0) + 1

    this.emit('release', err, client)

    // TODO(bmc): expose a proper, public interface _queryable and _ending
    if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses!) {
      if (client._poolUseCount >= this.options.maxUses!) {
        this.log('remove expended client')
      }
      this._remove(client)
      this._pulseQueue()
      return
    }

    const isExpired = this._expired.has(client)
    if (isExpired) {
      this.log('remove expired client')
      this._expired.delete(client)
      this._remove(client)
      this._pulseQueue()
      return
    }

    // idle timeout
    let tid: NodeJS.Timeout | undefined
    if (this.options.idleTimeoutMillis && this._isAboveMin()) {
      tid = setTimeout(() => {
        this.log('remove idle client')
        this._remove(client)
      }, this.options.idleTimeoutMillis)

      if (this.options.allowExitOnIdle) {
        // allow Node to exit if this is all that's left
        ;(tid as any).unref?.()
      }
    }

    if (this.options.allowExitOnIdle) {
      client.unref?.()
    }

    this._idle.push(new IdleItem(client, idleListener, tid))
    this._pulseQueue()
  }

  public query(text: any, values?: any, cb?: any): any {
    // guard clause against passing a function as the first parameter
    if (typeof text === 'function') {
      const response = promisify(this.Promise, text)
      setImmediate(function () {
        return response.callback(new Error('Passing a function as the first parameter to pool.query is not supported'))
      })
      return response.result
    }

    // allow plain text query without values
    if (typeof values === 'function') {
      cb = values
      values = undefined
    }
    const response = promisify(this.Promise, cb)
    cb = response.callback

    console.log('🔍 Executing query:', text.toString().substring(0, 50) + (text.toString().length > 50 ? '...' : ''));

    this.connect((err: any, client: any) => {
      if (err) {
        console.log('❌ Failed to get client for query:', err.message);
        return cb(err)
      }

      let clientReleased = false
      const onError = (err: any) => {
        if (clientReleased) {
          return
        }
        clientReleased = true
        client.release(err)
        cb(err)
      }

      client.once('error', onError)
      this.log('dispatching query')
      try {
        client.query(text, values, (err: any, res: any) => {
          this.log('query dispatched')
          client.removeListener('error', onError)
          if (clientReleased) {
            return
          }
          clientReleased = true
          client.release(err)
          if (err) {
            console.log('❌ Query failed:', err.message);
            return cb(err)
          }
          console.log('✅ Query executed successfully');
          return cb(undefined, res)
        })
      } catch (err) {
        console.log('❌ Query execution error:', (err as Error).message);
        client.release(err)
        return cb(err)
      }
    })
    return response.result
  }

  public end(cb?: (err?: any) => void): any {
    console.log('🔚 Ending PostgreSQL pool...');
    this.log('ending')
    if (this.ending) {
      const err = new Error('Called end on pool more than once')
      return cb ? cb(err) : this.Promise.reject(err)
    }
    this.ending = true
    const promised = promisify(this.Promise, cb)
    this._endCallback = () => {
      console.log('✅ PostgreSQL pool ended successfully');
      promised.callback();
    }
    this._pulseQueue()
    return promised.result
  }

  get waitingCount(): number {
    return this._pendingQueue.length
  }

  get idleCount(): number {
    return this._idle.length
  }

  get expiredCount(): number {
    return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0)
  }

  get totalCount(): number {
    return this._clients.length
  }
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fspdb',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export default pool;