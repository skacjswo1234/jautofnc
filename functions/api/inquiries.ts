export interface Env {
  'jautofnc-db': D1Database;
}

export interface Inquiry {
  id: number;
  name: string;
  phone1: string;
  phone2: string;
  phone3: string;
  car_name: string | null;
  rent_type: string;
  months: string;
  business_type: string;
  created_at: string;
  status: string;
}

// GET: 문의 목록 조회
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  
  try {
    let query = 'SELECT * FROM inquiries ORDER BY created_at DESC';
    let params: string[] = [];
    
    if (status !== 'all') {
      query = 'SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC';
      params = [status];
    }
    
    const result = await env['jautofnc-db'].prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      data: result.results || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// DELETE: 문의 삭제
export async function onRequestDelete(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID is required'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  try {
    await env['jautofnc-db']
      .prepare('DELETE FROM inquiries WHERE id = ?')
      .bind(id)
      .run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry deleted successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// PATCH: 문의 상태 업데이트
export async function onRequestPatch(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context;
  
  try {
    const body = await request.json() as { id: number; status: string };
    
    if (!body.id || !body.status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID and status are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    await env['jautofnc-db']
      .prepare('UPDATE inquiries SET status = ? WHERE id = ?')
      .bind(body.status, body.id)
      .run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Status updated successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// OPTIONS: CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
