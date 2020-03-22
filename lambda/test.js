const moment = require("moment");

const duration = moment.duration("PT2M15S");

const hours = (duration.hours()>0)? `${duration.hours()} ${(duration.hours()==1) ? "hour" : "hours"},` : "" ,
      minutes = (duration.minutes()>0)? `${duration.minutes()} ${(duration.minutes()==1) ? "minute" : "minutes"} ` : "",
      seconds = (duration.seconds()>0)? `${duration.seconds()} ${(duration.seconds()==1) ? "second" : "seconds"}` : ""

console.log(`${hours} ${minutes} ${seconds}`);