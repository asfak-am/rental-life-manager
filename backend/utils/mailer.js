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
  const pass = pickEnv('SMTP_PASS', 'EMAIL_PASS')
  const secureValue = pickEnv('SMTP_SECURE')

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port || 587),
      secure: String(secureValue || '').toLowerCase() === 'true',
      auth: {
        user,
        pass,
      },
    })
  }

  // Fallback transport for local/dev so API keeps working without SMTP setup.
  return nodemailer.createTransport({ jsonTransport: true })
}

const transporter = getTransport()

const sendMail = async ({ to, subject, html }) => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@rental-life.local'
  const info = await transporter.sendMail({ from, to, subject, html })
  if (info?.message) console.log(`Mail preview for ${to}: ${info.message.toString()}`)
}

module.exports = { sendMail }
