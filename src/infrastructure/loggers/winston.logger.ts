import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { Syslog } from 'winston-syslog';

const syslogTransport = new Syslog({
  app_name: 'workitfy-backend',
  localhost: process.env.NODE_ENV,
  eol: '\n',
  format: format.json(),
});

export const winstonLogger = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console({
      format: format.logstash(),
    }),
    syslogTransport,
  ],
});
