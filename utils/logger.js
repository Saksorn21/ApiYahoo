import chalk from "chalk"
import isUnicodeSupported from './unicode.js'
const arrow  = isUnicodeSupported ? '➜' : '->'
class Logger {
  constructor(io = null){
    this.io = io
    this.instance = console.log
    this.logger = undefined
    this.endpoint = ''
    this.method = ''
    this.ip = ''
    this.statusCode = null
    this.timeMs = null
    this.message = undefined
    this.isFinish = false
    this.finishMessage = ''
  }
  setSocketIO(io) {
  this.io = io
    console.log('connect socket.io', this.io.id)
  }
  formatStatusCode(){
    let code = this.statusCode
    if(code >= 200 && code < 300) code = chalk.green.bold(code)
    if(code >= 300 && code < 400) code = chalk.yellow.bold(code)
    if(code >= 400 && code < 500) code = chalk.red.bold(code)
    if(code >= 500) code = chalk.bgRed.bold(code)
    this.finishMessage += code
  }
  formatMethod(){
    const wh = chalk.white.bold
    let format = ''
    const mh = this.method.toUpperCase()
    if(mh === 'GET')  format = chalk.green.bold(mh) 
    if(mh === 'POST')  format = chalk.blue.bold(mh)
    if(mh === 'PUT')  format = chalk.yellow.bold(mh)
    if(mh === 'DELETE')  format = chalk.red.bold(mh)
     this.finishMessage += wh('[') + format + wh(']')
  }
  formatLog(){
    const ml = this.logger.toUpperCase()
    const wh = chalk.white.bold
    const gr = chalk.bgGreen.bold
    const re = chalk.bgRed.bold
    const bl = chalk.white.bgBlue.bold
    const ye = chalk.bgYellow
    const bk = chalk.blackBright.bold
    const mg = chalk.bgMagentaBright.bold
  
    if(ml === 'LOG') this.logger = chalk.bgHex('#00ffaf').bold(ml)
    if(ml === 'INFO')  this.logger = bl(ml)
    if(ml === 'ERROR') this.logger = re(ml)
    if(ml === 'WARN') this.logger = ye(ml)
      this.finishMessage += this.logger
    
  }
  blank(){
    this.finishMessage +=  ' '
  }
  formatTime(){
    this.timeMs = chalk.blackBright.bold.dim(`+${this.timeMs}ms.`) 
    
    this.finishMessage += this.timeMs
  }
  formatEndpoint(){
    this.endpoint = chalk.whiteBright.bold(this.endpoint)
    this.finishMessage += this.endpoint
     
  }
  formatmessage(){
    if(this.message !== undefined) this.finishMessage += chalk.whiteBright(': ' + this.message)
  }
  processFormat(){
    this.formatLog()
    this.formatMethod()
    this.blank()
    this.formatEndpoint()
    this.blank()
    this.finishMessage += chalk.blackBright.italic(this.ip)
    this.finishMessage += chalk.blackBright.bold(arrow)
    this.blank()
    this.formatStatusCode()
    this.formatTime()
    this.isFinish = false
    if(this.message !== undefined) {
      
      this.formatmessage()
      this.isFinish = true
      }
    this.isFinish = true
  }
  log(method, logLevel, statusCode, endpoint, timeMs, ip, message = undefined){
    this.isFinish = false
    this.statusCode = statusCode
    this.logger = logLevel
    this.endpoint = endpoint
    this.method = method
    this.ip = ip
    this.timeMs = timeMs
    if(message !== undefined) this.message = message
    this.processFormat()
    if (this.isFinish) {
      this.isFinish = false;
      const result = this.finishMessage;
      console[result ? 'info' : 'log'](result); // console.log หรือ console.info ตามที่คุณมี

      // ส่ง log ไป socket.io ด้วย ถ้ามี
      if (this.io) {
        console.log('Sending log to socket.io')
        this.io.emit('server-log', {
          method,
          logLevel,
          statusCode,
          endpoint,
          ip,
          timeMs,
          message,
          formatted: chalk.reset(result),
        });
      }

      this.finishMessage = '';
      return;
    }

    this.isFinish = false;
    this.finishMessage = '';
  }
  debug(...messages) {
    if (process.env.NODE_ENV === 'development') {
      // เวลาประเทศไทย (Asia/Bangkok)
      const timestamp = chalk.gray(
        `[${new Date().toLocaleString('th-TH', {
          timeZone: 'Asia/Bangkok',
          hour12: false
        })}]`
      );

      const label = chalk.bgHex('#ff8700').black.bold(' DEBUG ');

      return console.log(
        label,
        timestamp,
        ...messages.map(m =>
          chalk.whiteBright(typeof m === 'string' ? m : JSON.stringify(m, null, 2))
        )
      );
    }
  }
}
export default new Logger