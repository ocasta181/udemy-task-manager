const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'andrin.foster@gmail.com',
    subject: "Welcome to Task App",
    text: `Welcome ${name}! Let me know how you get along with the app.`
  })
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'andrin.foster@gmail.com',
    subject: "Sorry to see you go",
    text: `What happened ${name}!? Do you hate us?`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}