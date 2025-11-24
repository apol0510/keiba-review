import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, subject, message } = data;

    // バリデーション
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: '必須項目が入力されていません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'メールアドレスの形式が正しくありません' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SendGridでメール送信（環境変数が設定されている場合）
    const sendgridApiKey = import.meta.env.SENDGRID_API_KEY;
    const adminEmail = import.meta.env.ADMIN_EMAIL;

    if (sendgridApiKey && adminEmail) {
      const subjectMap: Record<string, string> = {
        site_request: 'サイト掲載リクエスト',
        review_report: '口コミに関する報告',
        bug_report: '不具合の報告',
        other: 'その他',
      };

      const emailContent = `
【お問い合わせ】${subjectMap[subject] || subject}

お名前: ${name}
メールアドレス: ${email}
お問い合わせ種別: ${subjectMap[subject] || subject}

【お問い合わせ内容】
${message}
      `.trim();

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: adminEmail }] }],
          from: { email: adminEmail, name: '競馬予想サイト口コミ' },
          reply_to: { email, name },
          subject: `【お問い合わせ】${subjectMap[subject] || subject} - ${name}様`,
          content: [{ type: 'text/plain', value: emailContent }],
        }),
      });

      if (!response.ok) {
        console.error('SendGrid error:', await response.text());
        return new Response(JSON.stringify({ error: 'メール送信に失敗しました' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // SendGridが設定されていない場合はログに出力
      console.log('Contact form submission:', { name, email, subject, message });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(JSON.stringify({ error: 'サーバーエラーが発生しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
