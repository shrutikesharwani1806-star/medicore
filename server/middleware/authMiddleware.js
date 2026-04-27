import jwt from "jsonwebtoken"
import User from "../models/userModel.js"

const forUser = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            let token = req.headers.authorization.split(" ")[1]
            let decoded = jwt.verify(token, process.env.JWT_SECRET)
            let user = await User.findById(decoded.id).select("-password")
            if (!user) {
                res.status(401)
                throw new Error('User not found!')
            }
            req.user = user
            next()
        } else {
            res.status(401)
            throw new Error('Unauthorised Access! : No Token Found..')
        }
    } catch (error) {
        res.status(401)
        throw new Error('Unauthorised Access!')
    }
}

const forAdmin = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            let token = req.headers.authorization.split(" ")[1]
            let decoded = jwt.verify(token, process.env.JWT_SECRET)
            let user = await User.findById(decoded.id).select("-password")
            if (!user) {
                res.status(401)
                throw new Error('User not found!')
            }
            req.user = user
            if (user.isAdmin) {
                next()
            } else {
                res.status(403)
                throw new Error('Unauthorised Access! : Admin Access Only...')
            }
        } else {
            res.status(401)
            throw new Error('Unauthorised Access! : No Token Found..')
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(401).json({ message: error.message || 'Unauthorised Access!' })
        }
    }
}

const forDoctor = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            let token = req.headers.authorization.split(" ")[1]
            let decoded = jwt.verify(token, process.env.JWT_SECRET)
            let user = await User.findById(decoded.id).select("-password")
            if (!user) {
                res.status(401)
                throw new Error('User not found!')
            }
            req.user = user
            if (user.isDoctor && user.isActive) {
                next()
            } else if (user.isDoctor && !user.isActive) {
                res.status(403)
                throw new Error('Your doctor account is pending approval.')
            } else {
                res.status(403)
                throw new Error('Unauthorised Access! : Doctor Access Only...')
            }
        } else {
            res.status(401)
            throw new Error('Unauthorised Access! : No Token Found..')
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(error.message?.includes('pending') ? 403 : 401).json({ message: error.message || 'Unauthorised Access!' })
        }
    }
}

const forPatient = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            let token = req.headers.authorization.split(" ")[1]
            let decoded = jwt.verify(token, process.env.JWT_SECRET)
            let user = await User.findById(decoded.id).select("-password")
            if (!user) {
                res.status(401)
                throw new Error('User not found!')
            }
            req.user = user
            if (user.role === 'patient' && !user.isAdmin && !user.isDoctor) {
                next()
            } else {
                res.status(403)
                throw new Error('Unauthorised Access! : Patient Access Only...')
            }
        } else {
            res.status(401)
            throw new Error('Unauthorised Access! : No Token Found..')
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(401).json({ message: error.message || 'Unauthorised Access!' })
        }
    }
}

const protect = { forUser, forAdmin, forDoctor, forPatient }

export default protect