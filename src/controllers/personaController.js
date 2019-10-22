'use strict'
var bcrypt = require('bcryptjs');
var fs = require('fs');
var path = require('path');
var jwt=require('../../services/jwt');

function saveUser(req, res) {
    var params = req.body;
   //  console.log(params);
    //creo el usuario que voy a guardar
    var user = new Object();
    if (params.documento && params.nombre && params.apellido&& params.email && params.password ) {

        user.documento = params.documento;
        user.nombre = params.nombre;
        user.apellido = params.apellido;
        user.email = params.email;
        //valido en mi BD que no exista un registro con el mismo email
        req.getConnection((err,conn)=>{
        var sql = 'SELECT * FROM persona WHERE email = ?';
            conn.query(sql,[String(user.email)],(err, user)=>{
                if(user.length>=1){
                    return  res.status(200).render('html/registro',{
                        message:'Email ya existe, intenta ingresando otro E-mail',
                    });
                }
            });
        });
        //Crifro la password  
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(String(params.password), salt, function(err, hash) {
                user.password = hash;
                req.getConnection((err, conn) => {
                    conn.query('INSERT INTO persona set ?', [user], (err, persona) => {
                        if(!persona){
                            return res.status(200).render('html/registro',{
                                message:'Documento ya existe'
                            });  
                        }
                         return res.status(200).render('html/login',{
                            message:'Registrado Correctamente'
                        });
                    });
                });
            });
        });
    }else{
        return res.status(200).render('html/registro',{
            message:'Debes completar todos los campos'
        }); 
    }
}

function login(req, res) {
        var params=req.body;
      
        var documento=params.documento;
        var password=params.password;
    
        req.getConnection((err,conn)=>{
            var sql = 'SELECT * FROM persona WHERE documento = ?';
            conn.query(sql,[String(documento)],(err, user)=>{
                    console.log(user.length);
                if(user.length==0){
                    return  res.status(200).render('html/login',{
                        message:'Documento No Registrado'
                    });
                }
                bcrypt.compare(password, user[0].password, (err, check)=>{//comparo la del POST con la encriptada
                    if(check){
                         user[0].password=undefined;//elimino la contraseña de los datos que retorno
                         //devolver datos de usuario
                         console.log(user[0].nombre);
                         if(params.gettoken){//Cambiar
                             //generar y devolver token
                             
                             return  res.status(200).render('html/index',{
                                token: jwt.createToken(user),
                                user:user[0],
                            });
                         }else{
                            return  res.status(200).render('html/index',{
                                user:user[0]
                            });
                         }
                    }else{
                        return  res.status(200).render('html/login',{
                            message:'Documento o Contraseña Incorrecta',
                        });
                    }
                  });
            });
        });
}
module.exports = {
    saveUser,
    login
}
