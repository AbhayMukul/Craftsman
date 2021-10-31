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

var app_craftsman = express();
app_craftsman.use(cors());
app_craftsman.use(bodyparser.json());
app_craftsman.listen('2000', () => {
    console.log('craftsman server running at port 2000');
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

app_craftsman.get('/api/get/craftsman/:id',(req,res) => {
    console.log(req.params.id);

    let sql = `SELECT BOOKING_INFORMATION.SOCEITY,BOOKING_INFORMATION.FLAT,BOOKING_INFORMATION.time,BOOKING_INFORMATION.day
                FROM BOOKING_INFORMATION, BOOKING_CONFIRMATION
                WHERE BOOKING_CONFIRMATION.ID_CRAFTSMAN = ${req.params.id}
                AND BOOKING_CONFIRMATION.ID_REQUEST = BOOKING_INFORMATION.ID;
                `;

    db.query(sql,(err,result) => {
        if(err){
            console.log(err);
        }else{
            res.send(result);
        }
    })
})

// close process at port 5000 sudo kill -9 `sudo lsof -t -i:5000`

app.get('/api/getAllGrievances', (req, res) => {
    // , CRAFTSMAN.PHONE AS PHONE 
    let sql = ` SELECT BOOKING_CONFIRMATION.ID_REQUEST AS GRIEVANCE_ID,BOOKING_CONFIRMATION.ID_CRAFTSMAN AS CRAFTSMAN_ID,CRAFTSMAN.NAME AS NAME , BOOKING_INFORMATION.PROFESSION , BOOKING_INFORMATION.time , BOOKING_INFORMATION.day , BOOKING_INFORMATION.ACTIVE 
                FROM CRAFTSMAN,BOOKING_INFORMATION,BOOKING_CONFIRMATION
                WHERE BOOKING_CONFIRMATION.ID_CRAFTSMAN = CRAFTSMAN.ID 
                AND BOOKING_CONFIRMATION.ID_REQUEST = BOOKING_INFORMATION.ID
                AND BOOKING_INFORMATION.FLAT = '${req.query.flat}'
                AND BOOKING_INFORMATION.SOCEITY = '${req.query.name}';
                `;

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.send(result);
        }
    })
})

// app.delete('/api/delete/:grievance_id&:new', (req,res) => {
//     let sql = ` DELETE FROM TABLE BOOKING_CONFIRMATION
//                 WHERE ID_REQUEST = ${req.params.grievance_id};
//                 `;

//     console.log(req.params.grievance_id,req.params.new);
// })

app.delete('/api/delete/done/:grievance_id', (req, res) => {
    let sql = ` DELETE FROM BOOKING_CONFIRMATION
                WHERE ID_REQUEST = ${req.params.grievance_id};
                `;

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            let sql_Update = `  UPDATE BOOKING_INFORMATION 
                                SET BOOKING_INFORMATION.ACTIVE = 0
                                WHERE BOOKING_INFORMATION.ID = ${req.params.grievance_id};
                                `;

            db.query(sql_Update, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            })
        }
    })
})

app.delete('/api/delete/remove/:grievance_id', (req, res) => {
    let sql_remove_booking_confirmation = ` DELETE FROM BOOKING_CONFIRMATION
                WHERE ID_REQUEST = ${req.params.grievance_id};
                `;

    db.query(sql_remove_booking_confirmation, (err, result) => {
        if (err) {
            console.log(err);
        } else {
            let sql_remove_booking_information = `  DELETE FROM BOOKING_INFORMATION
                                WHERE ID = ${req.params.grievance_id};
                                `;

            db.query(sql_remove_booking_information, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    res.send(result);
                }
            })
        }
    })
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
                                            AND BOOKING_INFORMATION.time = '${req.body.time}'
                                            AND BOOKING_INFORMATION.day = '${req.body.day}'
                                            AND CITY = 'Pune'
                                            GROUP BY CRAFTSMAN.ID)
                                        ORDER BY RAND() LIMIT 0,1
                                        ;`;

            db.query(sql_find_craftsman, (err, result) => {
                if (err) {
                    console.log(err);
                } else {
                    var exists = JSON.parse(JSON.stringify(result[0]));
                    ID_CRAFTSMAN = exists.ID;

                    console.log("ID_GRIEVANCE : " + ID_GRIEVANCE);
                    console.log("ID_CRAFTSMAN : " + ID_CRAFTSMAN);


                    let sql_booking_confirmation = `INSERT INTO BOOKING_CONFIRMATION VALUES (${ID_CRAFTSMAN},${ID_GRIEVANCE});`

                    db.query(sql_booking_confirmation, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.send("Grievance logged");
                        }
                    })
                }
            })
        }
    })
});