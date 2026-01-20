// POST: 관리자 로그인
export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const body = await request.json();
    
    if (!body.password) {
      return new Response(JSON.stringify({
        success: false,
        error: '비밀번호를 입력하세요.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // 관리자 비밀번호 조회
    const result = await env['jautofnc-db']
      .prepare('SELECT password FROM admin LIMIT 1')
      .first();
    
    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: '관리자 정보를 찾을 수 없습니다.'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // 비밀번호 단순 비교 (평문 저장)
    if (result.password === body.password) {
      return new Response(JSON.stringify({
        success: true,
        message: '로그인 성공'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: '비밀번호가 일치하지 않습니다.'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
