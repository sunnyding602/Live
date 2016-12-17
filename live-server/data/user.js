const mongoCollections = require("../config/mongoCollections");
const userCollection = mongoCollections.users;
const bcrypt = require("bcrypt");
const uuid = require("node-uuid");

let exportedMethods = {
    getAllUsers() {
        return userCollection().then((users) => {
            return users
                .find()
                .toArray();
        });
    },
    getUser(id) {
        return userCollection().then((users) => {
            return users.findOne({_id: id})
        });
    },

    createUser(email, nickname, password) {
        if(!email || !nickname || !password) {
            return Promise.reject("empty email or password or nickname");
        }

        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(password, salt);
        let id = uuid.v4();
        
        return userCollection().then((users) => {
            return users.insertOne({_id: id, session_id: "", email: email, nickname: nickname, password: hash});         
        }).then((user) => {
            return this.getUser(user.insertedId);
        }).catch((err)=>{
            console.error(err);
            return Promise.reject(err);
        });
    },

    login(email,password) {
        if(!email || !password) {
            return Promise.reject("Provide valid username and password");
        }
        
        return userCollection().then((users)=> {
            
            return users.findOne({email:email});

        }).then((user)=> {
            if(!user) {
                return Promise.reject("This email is not registered");
            }
            if(bcrypt.compareSync(password, user.password)) {
                
                return user;
            }else {
                return Promise.reject ("wrong password");
            }
        }).then((user)=> {

            return this.updateSessionId(user._id);
        }).catch((err)=> {

            return Promise.reject(err);
        });  
    },

    updateSessionId(userId) {
        
        let session_id = uuid.v4();
        return userCollection().then((users)=> {
            return users.updateOne({_id: userId}, {$set:{session_id: session_id}}).then(()=> {
                return this.getUser(userId);
            })
        }).catch((err)=>{
            return Promise.reject(err);
        });
    },

    findBySessionId(sessionId){
        return userCollection().then(users=>{
            return users.findOne({session_id: sessionId}).then(user=>{
				return user;
            });
        }).catch((err)=>{
            return Promise.reject(err);
        });
    },

	attachUserToReq(req, res, next){
		if(!req.cookies.sessionId) return next();
		return exportedMethods.findBySessionId(req.cookies.sessionId).then( user=>{
			if(user){
				req.user = user;
                res.locals.user = user;
			}
			return next();	
		}).catch(err=>{
			console.log(err);
			return next();
		});
	},
	ensureLogin(req, res, next){
		if(req.user){
			return next();
		}else{
			res.redirect("/");
		}
	},
    fakeUser(req, res, next){
        req.user = {};
        req.user._id = '96c6c022-8189-4e4a-8628-643d0bb99903';
        next();
    },
	// updateUserInfo(id,updateinfo) {
    //     let userId = id;
    //     let updateprofile = {info:updateinfo};
       
    //     return userCollection().then((users)=> {
    //         return users.updateOne({_id: userId},{$set:{profile: updateprofile}}).then(()=> {
    //             return this.getUser(userId); 
    //         });
    //     });
    // },

    deleteUser(id) {
        let userId = id;
        return userCollection().then((users)=>{
            
            return users.deleteOne({_id:id}).then((execResult, err)=>{
               if(err == null && execResult.deletedCount == 1) {
                    console.log("delete success");
                    return true;
                }else {
                    return Promise.reject ("cannot delete item" + err);
                }
            });
        });
    }
}

module.exports = exportedMethods;
