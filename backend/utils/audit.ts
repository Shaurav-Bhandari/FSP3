import pool from '../db';

export async function logAudit(
    adminId: string | undefined,
    action: string,
    tableName: string,
    recordId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string
) {
    try {
        await pool.query(
            `INSERT INTO audit_log (admin_id, action, table_name, record_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [adminId, action, tableName, recordId, oldValues, newValues, ipAddress]
        );
    } catch (error) {
        console.error('Audit log error:', error);
    }
} 