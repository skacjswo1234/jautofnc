export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body || {};

        if (!currentPassword || !newPassword) {
            return new Response(
                JSON.stringify({ success: false, error: 'Current and new password are required' }),
                { status: 400 }
            );
        }

        const db = env['jautofnc-db'];
        const { results } = await db.prepare('SELECT password FROM admin WHERE id = 1').all();
        const storedPassword = results[0]?.password;

        if (currentPassword !== storedPassword) {
            return new Response(
                JSON.stringify({ success: false, error: 'Current password is incorrect' }),
                { status: 401 }
            );
        }

        await db.prepare('UPDATE admin SET password = ? WHERE id = 1')
            .bind(newPassword)
            .run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
}
