const { sendMail } = require('../utils/mailer')

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const submitSupportRequest = async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim()
    const subject = String(req.body?.subject || '').trim()
    const message = String(req.body?.message || '').trim()

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' })
    }

    const supportEmail = process.env.SUPPORT_EMAIL || 'support.rentallife@gmail.com'
    const accountLabel = req.user?.displayName || req.user?.name || 'Unknown user'

    const html = `
      <h2>Rental Life Support Request</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p><strong>Account:</strong> ${escapeHtml(accountLabel)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
    `

    await sendMail({
      to: supportEmail,
      subject: `[Rental Life Support] ${subject}`,
      html,
    })

    return res.status(200).json({ message: 'Support request sent successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = { submitSupportRequest }