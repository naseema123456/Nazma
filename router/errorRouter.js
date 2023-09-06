const express=require('express')
const router=express()

const errorController= require('../controller/error')


router.set('view engine', 'ejs')
router.set('views', './views/users');


router.get('/*',errorController.error)

module.exports=router