const crypto = require('crypto')

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateInviteCode = (prefix = 'RL') => {
	const bytes = crypto.randomBytes(8)
	const parts = []

	for (let part = 0; part < 2; part += 1) {
		let segment = ''
		for (let index = 0; index < 4; index += 1) {
			const byte = bytes[part * 4 + index]
			segment += alphabet[byte % alphabet.length]
		}
		parts.push(segment)
	}

	return `${prefix}-${parts.join('-')}`
}

module.exports = { generateInviteCode }
