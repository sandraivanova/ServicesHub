import * as nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import * as path from 'path';
import { NodemailerExpressHandlebarsOptions } from 'nodemailer-express-handlebars';

export const mailTransporter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE || 'gmail',
  auth: {
    user: process.env.NODEMAILER_AUTH_USER,
    pass: process.env.NODEMAILER_AUTH_PASS,
  },
});

const handlebarOptions: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    extname: '.handlebars',
    layoutsDir: path.resolve('./views/mail'),
    defaultLayout: undefined,
  },
  viewPath: path.resolve('./views/mail'),
  extName: '.handlebars',
};

mailTransporter.use('compile', hbs(handlebarOptions));
