import chalk from "chalk"
class Logger {
  constructor(){
    this.instance = console.log
    this.message = ''
  }
  formatMessage(log, mag){
    const ml = log.toUpperCase()
    const wh = chalk.white.bold
    const gr = chalk.bgGreen.bold
    const re = chalk.bgRed.bold
    const bl = chalk.bgBlue.bold
    const ye = chalk.bgYellow
    const bk = chalk.blackBright.bold
    const format = (l) => `${wh('[')}${l}${wh(']')} ${bk(':')} ${chalk.whiteBright(msg)}`
    if(ml === 'LOG') return format(gr(ml, mag))
    if(ml === 'INFO') return format(bl(ml, msg))
    if(ml === 'ERROR') return format(re(ml, msg))
    if(ml === 'WARN') return format(ye(ml, msg))
    return format(ml, msg)
    
  }
  log(log, msg){
    this.message = msg
   return  this.formatMessage(log, msg)
    
  }
  info(msg){
    const message =
  }
}
export default new Logger