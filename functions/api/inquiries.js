// GET: 문의 목록 조회
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  
  try {
    let query = 'SELECT * FROM inquiries ORDER BY created_at DESC';
    let params = [];
    
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
  } catch (error) {
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
export async function onRequestDelete(context) {
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
  } catch (error) {
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

// PATCH: 문의 상태 및 메모 업데이트
export async function onRequestPatch(context) {
  const { env, request } = context;
  
  try {
    const body = await request.json();
    
    if (!body.id) {
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
    
    // 상태와 메모를 각각 업데이트할 수 있도록 처리
    if (body.status !== undefined && body.memo !== undefined) {
      // 상태와 메모 모두 업데이트
      await env['jautofnc-db']
        .prepare('UPDATE inquiries SET status = ?, memo = ? WHERE id = ?')
        .bind(body.status, body.memo || null, body.id)
        .run();
    } else if (body.status !== undefined) {
      // 상태만 업데이트
      await env['jautofnc-db']
        .prepare('UPDATE inquiries SET status = ? WHERE id = ?')
        .bind(body.status, body.id)
        .run();
    } else if (body.memo !== undefined) {
      // 메모만 업데이트
      await env['jautofnc-db']
        .prepare('UPDATE inquiries SET memo = ? WHERE id = ?')
        .bind(body.memo || null, body.id)
        .run();
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'status or memo is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Updated successfully'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
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

// POST: 문의 생성
export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.name || !body.phone1 || !body.phone2 || !body.phone3 || !body.rent_type || !body.months || !body.business_type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Required fields are missing'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // 한국 시간(KST, UTC+9)으로 현재 시간 생성
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const kstDateString = kstTime.toISOString().slice(0, 19).replace('T', ' ');
    
    await env['jautofnc-db']
      .prepare(`
        INSERT INTO inquiries (name, phone1, phone2, phone3, car_name, rent_type, months, business_type, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `)
      .bind(
        body.name,
        body.phone1,
        body.phone2,
        body.phone3,
        body.car_name || null,
        body.rent_type,
        body.months,
        body.business_type,
        kstDateString
      )
      .run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Inquiry created successfully'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
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
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
