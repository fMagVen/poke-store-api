import bcrypt from 'bcrypt'
import connection from '../database/database.js'
import jwt from 'jsonwebtoken'

const postSignUp = async(req, res) => {
	try{
		const find = req.body.email
		const { db } = await connection()
		const existingUser = await db.collection('users').findOne( {email: find} )
		if(existingUser){
			return res.status(409).send('Conflict: e-mail already registered!')
		}
		const salt = Number(process.env.MAGIC_HASH_NUMBER)
		const hashedPassword = bcrypt.hashSync(req.body.password, salt)
		await db.collection('users').insertOne({... req.body, password: hashedPassword})
		res.sendStatus(201)
	}catch(e){
		console.log(e)
		res.sendStatus(500)
	}
}

const postLogin = async(req, res) => {
	try{
		const { db } = await connection()
		const user = await db.collection('users').findOne({email: req.body.email})
		if(!user){
			return res.status(404).send('User not found!')
		}
		if (bcrypt.compareSync(req.body.password, user.password)) {
			const userData = { username: user.username, email: user.email }
			const secretKey = process.env.JWT_SECRET
			const finalData = jwt.sign(userData, secretKey)
			await db.collection('sessions').insertOne({ user_id: user._id, finalData })
			return res.status(200).send({username: user.username, image: user.image, finalData})
		}
		else{
			res.sendStatus(401)
		}
	}catch(e){
		console.log(e)
		res.sendStatus(500)
	}
}

export { postSignUp, postLogin }
