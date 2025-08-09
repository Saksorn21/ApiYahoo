import chalk from "chalk"
import isUnicodeSupported from './unicode.js'
const arrow  = isUnicodeSupported ? '➜' : '->'
class Logger {
  constructor(){
    this.instance = console.log
    this.logger = undefined
    this.endpoint = ''
    this.method = ''
    this.statusCode = null
    this.timeMs = null
    this.message = undefined
    this.isFinish = false
    this.finishMessage = ''
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
  log(method, log, statusCode, endpoint, timeMs, message = undefined){
    this.isFinish = false
    this.statusCode = statusCode
    this.logger = log
    this.endpoint = endpoint
    this.method = method
    this.timeMs = timeMs
    if(message !== undefined) this.message = message
    this.processFormat()
   if(this.isFinish){ 
     this.isFinish = false
     const result = this.finishMessage
     this.finishMessage = ''
     return console[log](result)
   }
    this.isFinish = false
    this.finishMessage = ''
  }
}
export default new Logger