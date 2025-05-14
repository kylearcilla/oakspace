export function err({ status, message }: { status: number, message?: string }) {
    const defaultMessages: { [key: number]: string } = {
        400: 'Bad Request',
        401: 'Unauthorized',
        404: 'Not Found',
        500: 'Internal Server Error'
    }

return new Response(JSON.stringify({ error: message || defaultMessages[status] || 'Error' }), { status })
}