const nodemailer = require('nodemailer')

const pickEnv = (...keys) => {
  for (const key of keys) {
    if (process.env[key]) return process.env[key]
  }
  return ''
}

const getTransport = () => {
  const host = pickEnv('SMTP_HOST', 'EMAIL_HOST')
  const port = pickEnv('SMTP_PORT', 'EMAIL_PORT')
  const user = pickEnv('SMTP_USER', 'EMAIL_USER')
  const rawPass = pickEnv('SMTP_PASS', 'EMAIL_PASS')
  const pass = String(rawPass || '').replace(/\s+/g, '')
  const secureValue = pickEnv('SMTP_SECURE')
  const portNumber = Number(port || 587)
  const secure = secureValue
    ? String(secureValue).toLowerCase() === 'true'
    : portNumber === 465

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: portNumber,
      secure,
      auth: {
        user,
        pass,
      },
    })
  }

  throw new Error('SMTP is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS in backend/.env')
}

const sendMail = async ({ to, subject, html }) => {
  const transporter = getTransport()
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@rental-life.local'
  const info = await transporter.sendMail({ from, to, subject, html })

  const accepted = Array.isArray(info?.accepted) ? info.accepted : []
  const rejected = Array.isArray(info?.rejected) ? info.rejected : []

  if (info?.message) {
    console.log(`Mail preview for ${to}: ${info.message.toString()}`)
  } else {
    console.log(`Mail delivery result for ${to}: accepted=${accepted.join(',') || '-'} rejected=${rejected.join(',') || '-'}`)
  }

  if (rejected.some(item => String(item).toLowerCase() === String(to).toLowerCase())) {
    throw new Error('Email delivery failed: recipient was rejected by SMTP provider')
  }

  if (!info?.message && accepted.length === 0) {
    console.warn(`SMTP response did not include accepted recipients for ${to}; assuming send succeeded because transport did not throw.`)
  }
}

module.exports = { sendMail }
