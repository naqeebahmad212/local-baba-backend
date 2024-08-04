const nodeMailer=require('nodemailer')

interface EmailOptions{
    email:string
    subject:string
    message:string
}

export const sendEmail=async(options:EmailOptions)=>{
    const transporter= nodeMailer.createTransport({
        service:process.env.SMTP_SERVICE,
        host: 'smtp.gmail.com',
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD
        }
    })
    const mailOptions={
        from:process.env.SMTP_MAIL,
        to:options.email,
        subject:options.subject,
        text:options.message
    }

   const res = await transporter.sendMail(mailOptions)
   
}


