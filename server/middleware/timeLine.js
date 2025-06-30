const db = require('../config/db');
const createError = require("http-errors");

// checkTimeLine is a higher order function, when this funciton is called this function calls the inner function with (req,res,next)

const checkTimeline = (timeLineName) => (req, res, next) => {
    try {
        if (timeLineName.trim() == "") return next(createError.BadRequest("timeLineName is not found!!"));
        let sql = "select start_date, end_date from timeline where name = ? limit 1";
        db.query(sql, [timeLineName], (error, result) => {
            if (error) return next(error);
            if (result.length === 0) return next(createError.NotFound("Timeline not found!"));
            const start_date = new Date(result[0].start_date);
            const end_date = new Date(result[0].end_date);

            const currentDate = new Date();

            if (currentDate < start_date) {
                return res.status(403).json({ message: "Timeline not yet started!" });
            }
            else if (currentDate > end_date) {
                return res.status(403).json({ "message": "TimeLine had been ended!!" });
            }

            next();
        })
    }
    catch (error) {
        next(error);
    }
}

module.exports = checkTimeline;