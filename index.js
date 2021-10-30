var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var bodyparser = require('body-parser');
const e = require('express');
var app = express();

app.use(cors());
app.use(bodyparser.json());
app.listen('5000', () => {
    console.log('server running at port 5000');
});

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var db = mysql.createConnection({
    host: "database-1.cxaqyyfsqya9.ap-south-1.rds.amazonaws.com",
    user: "admin",
    password: "admin1234",
    database: "CRAFTSMAN"
});

db.connect((err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("database conected");
    }
})

app.post('/api/uploadGrievance', (req, res) => {
    var ID_GRIEVANCE;
    var ID_CRAFTSMAN;

    let sql_booking_information = ` INSERT INTO BOOKING_INFORMATION
                VALUES (NULL,'${req.body.phone}','${req.body.society}','${req.body.flat}','${req.body.grievance}','${req.body.time}','${req.body.day}',1);
                `;

    db.query(sql_booking_information, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            ID_GRIEVANCE = result.insertId;

            let sql_find_craftsman = ` SELECT CRAFTSMAN.ID AS ID FROM CRAFTSMAN 
                                        WHERE CRAFTSMAN.ID NOT IN (
                                            SELECT CRAFTSMAN.ID FROM CRAFTSMAN,BOOKING_CONFIRMATION,BOOKING_INFORMATION
                                            WHERE CRAFTSMAN.ID = BOOKING_CONFIRMATION.ID_CRAFTSMAN
                                            AND BOOKING_CONFIRMATION.ID_REQUEST = BOOKING_INFORMATION.ID
                                            AND BOOKING_INFORMATION.time = '12:00:00'
                                            AND BOOKING_INFORMATION.day = '08/11/21'
                                            AND CITY = 'Pune'
                                            GROUP BY CRAFTSMAN.ID)
                                        ORDER BY RAND() LIMIT 0,1
                                        ;`;

            db.query(sql_find_craftsman, (err, result) => {
                if(err){
                    console.log(err);
                }else{
                    var exists = JSON.parse(JSON.stringify(result[0]));
                    ID_CRAFTSMAN = exists.ID;

                    console.log("ID_GRIEVANCE : " + ID_GRIEVANCE);
                    console.log("ID_CRAFTSMAN : " + ID_CRAFTSMAN);


                    let sql_booking_confirmation = `INSERT INTO BOOKING_CONFIRMATION VALUES (${ID_CRAFTSMAN},${ID_GRIEVANCE});`

                    db.query(sql_booking_confirmation,(err,result) => {
                        if(err){
                            console.log(err);
                        }else{
                            res.send("Grievance logged");
                        }
                    })
                }
            })
        }
    })
});