const bcrypt = require('bcryptjs')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter password to hash: ', async (pw) => {
  const hash = await bcrypt.hash(pw, 10)
  console.log('Hash:', hash)
  rl.close()
})
