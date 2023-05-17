const { resolveInclude } = require("ejs");
const adminhelpers = require("../helpers/adminhelpers");
const userhelpers = require("../helpers/userhelpers");
const { category } = require("../model/connection");

const db = require('../model/connection')

var loginheader, loginStatus;


module.exports={

    getHome: async(req,res)=>{   
        if(loginStatus){
          let userId = req.session.user._id;  
           let username = req.session.user.username    
            const cartCount = await userhelpers.getCartCount(userId);
            wishcount = await userhelpers.getWishCount(req.session.user._id);
            if(cartCount){
                res.render('user/userhome',{loginheader:true, cartCount,userName:username,wishcount})
            } else {
                res.render('user/userhome',{loginheader:true,userName:username})
            }
        }else{
            res.render('user/userhome',{loginheader:false})
        }
    },


     showLogin:(req,res)=>{
          if(req.session.userIn){
            res.render('user/userhome',{loginheader:true})
          }else{
            res.render('user/login')
          }
       },


    postLogin:(req,res)=>{
        userhelpers.dologin(req.body).then((response)=>{           
            loginheader=true;
            loginStatus=response.status;     
            var blockedStatus=response.blockedStatus
            req.session.userIn = true
            if(loginStatus){
                req.session.user=response.response.user            
                req.session.userIn = true
                res.redirect('/')          
            }else{
                res.render('user/login',{loginStatus,blockedStatus,login:false})
                console.log(blockedStatus +'blocked status');
                console.log(loginStatus +'log');
            }
        })
    },
    zoomshopView: (req, res) => {
      if (req.session.userIn) {
        let user = req.session.user.username;
        let userId = req.session.user._id;
        userhelpers.zoomlistProductShop(req.params.id).then(async (response) => {
          let wishcount = await userhelpers.getWishCount(userId);
          let cartCount = await userhelpers.getCartCount(userId);
          res.render("user/imagezoom", {
            response,
            wishcount,
            cartCount,
            loginheader: true,
            userName: user,
          });
        });
      } else {
        userhelpers.zoomlistProductShop(req.params.id).then((response) => {
          res.render("user/imagezoom", { response, loginheader: false });
        });
      }
    },


    // zoomshopView:async(req,res)=>{
    //   let userId;
    //   if(req.session.user){
    //    userId = req.session.user._id
    //   }
    //     let username = req.session.user.username 
    //     const cartCount = await userhelpers.getCartCount(userId);
    //     wishcount = await userhelpers.getWishCount(req.session.user._id);
    //     userhelpers. zoomlistProductShop(req.params.id).then((response)=>{
    //         res.render('user/imagezoom',{response,loginheader:true,userName:username,userId,cartCount,wishcount})
    //     })
    //  },


    shopView:async(req,res)=>{
        const userId = req.session.user.id;
        let username = req.session.user.username 
        var search='';
        if(req.query.search)
        {
          search= req.query.search;
        }  
        var page=1;
        if(req.query.page){
            page=req.query.page;
        }  
        const limit=12
        const cartCount = await userhelpers.getCartCount(userId);
        wishcount = await userhelpers.getWishCount(req.session.user._id);
        userhelpers.listProductShop(search,page,limit).then((response)=>{
            adminhelpers.findAllcategories().then((cat)=>{
                res.render('user/shop',{response,cat,loginheader:true,cartCount,userName:username,wishcount})
            })        
       })
    },
  

    showSignup:(req,res)=>{
        res.render('user/signup',{emailStatus:true})
    },


    postSignup:(req,res)=>{
        userhelpers.doSignUp(req.body).then((response)=>{
            console.log(response)
            var emailStatus= response.status
            if(emailStatus){
                res.redirect('/login')
            }
            else{
                res.render('user/signup',{emailStatus})
            }
        })
    },


    userlogout:(req,res)=>{
        loginheader=false;
        loginStatus = false;
        req.session.userIn = false
        res.redirect('/');
    },

   
    //otp
    showotp:(req,res)=>{
        res.render('user/otplogin')
    },


    postotp:(req,res)=>{
        userhelpers.otpverification(req.body).then((response)=>{
            if(response.blocked){
            loginStatus=false
            res.redirect('/otplogin')
            }
            else{
            req.session.userIn=true
            loginStatus=true
            res.redirect('/')
            }
        })
        },


        //add-to-cart
        addToCart:(req,res)=>{          
            const userId=req.session.user._id;          
            const proId=req.params.id
            userhelpers.addToCarts(proId,userId).then(()=>{
            userhelpers.getCartCount(userId).then((cartCount)=>{
                if(cartCount){
                    res.json({status:true,cartCount})
                }else{
                    res.json({status:true})
                }
            })
        })  
        },
       

        getCartProducts:(req,res)=>{
            let userId;
           if(req.session.user){
            userId = req.session.user._id
           }
            let username = req.session.user.username
            userhelpers.displayProducts(userId).then(async(products)=>{
              wishcount = await userhelpers.getWishCount(req.session.user._id);
                let cartCount=await userhelpers.getCartCount(userId)
                total=await userhelpers.getTotalAmount(userId)
                if(cartCount ){
                     res.render('user/cart',{productExist: true, products,cartCount,loginheader:true,total,userName:username,wishcount})
                } else {
                    res.render('user/cart',{productExist : false,loginheader:true,userName:username,products})
                }
              
            })
        },


        deleteCartProduct:(req,res)=>{
          userhelpers.removeItem(req.params.id,req.session.user._id).then((resposne)=>{
            res.redirect("/cart")
          })
          .catch((err)=>{
            res.redirect("/cart")
          })
        },

       
        changeQuantity: (req, res) => {
            let userId;
            if(req.session.user){
             userId = req.session.user._id
            }
            userhelpers.change_Quantity(req.body).then(async (response) => {
                response.total = await userhelpers.getsubTotal(req.session.user._id)
                response.grandTotal=await userhelpers.getTotalAmount(userId)

                res.json(response)
        
            }).catch((error)=>{
                res.status(500)
               })
            },

      
       
          //wishlist management
          addToWishlist:async(req,res)=>{
            let username = req.session.user.username
            const userId=req.session.user._id;          
            const proId=req.params.id
            let WishlistCount =await userhelpers.getWishlistCount(userId);
            userhelpers.addToWishlist(proId,userId).then(()=>{
                console.log(WishlistCount,"oh namo narayana")
                res.render('user/wishList',{loginheader:true,WishlistCount,userName:username})
            })

          },


          wishlist:(req,res)=>{
            let userId;
           if(req.session.user){
            userId = req.session.user._id
           }
           let username = req.session.user.username
           userhelpers.displaywishlist(userId).then(async(products)=>{
                   res.render('user/wishList',{loginheader:true,products,userName:username})
           })
          },

          deleteWishlistProduct:(req,res)=>{
            let userId;
           if(req.session.user){
            userId = req.session.user._id
           }
            userhelpers.removeWishlistItem(req.params.id,userId).then((resposne)=>{
                res.redirect("/wishList")
              })
              .catch((err)=>{
                res.redirect("/wishList")
              })
          },


        
        //profile

        profile:async(req,res)=>{
            let userId=''
            if(req.session.user){
               userId = req.session.user._id
            }
            let user=''
             if(req.session.user){
                user=req.session.user
            }
            let balance = await userhelpers.getbalanceWallet(userId)
            const cartCount = await userhelpers.getCartCount(userId);
            wishcount = await userhelpers.getWishCount(req.session.user._id);
            let username = req.session.user.username
            let history = await userhelpers.gethistory(userId)
            let orders=await userhelpers.getUserOrders(userId)
            userhelpers.getAllAddress(userId).then((address)=>{
                 userhelpers.getUserDetails(userId).then((user)=>{
                res.render('user/profile',{loginheader:true,address,user,orders,userName:username,balance,history,cartCount,wishcount})
            })
        })
        },

        dashboard:(req,res)=>{
            let username = req.session.user.username
            res.render('user/dashboard',{loginheader:true,userName:username})
        },

        postAddress:(req,res)=>{
           let userId=''
            if(req.session.user){
               userId = req.session.user._id
            }
            userhelpers.addAddress(req.body,userId).then((data)=>{
              res.redirect('/profile')
            })
           },

           deleteAddress:(req,res)=>{
            let addressId=req.params.id
            userhelpers.deleteTheAddress(addressId).then((response)=>{
                res.redirect('/profile')
            })
           },

           getEditAddress:async(req,res)=>{
             let address=await userhelpers.getAddressDetails(req.params.id)
            res.render('user/editAddress',{loginheader:true,address})
           },

           postEditAddress:async(req,res)=>{
            let id=req.params.id
            userhelpers.updateAddress(id,req.body).then(()=>{
                 res.redirect('/profile')
            })
           },


           accountDetails: async (req, res) => {
            try {
              let userId=''
              if(req.session.user){
               userId = req.session.user._id
              }
              if (req.body.npassword === req.body.cpassword) {
                const updatedUser = await userhelpers.changePassword(userId, req.body);
                if (updatedUser) {
                  req.session.user.Password = req.body.npassword;
                      loginheader = false;
                      loginStatus = false;
                      req.session.user.username = false;
                      req.session.userIn = false;
                      req.session.user = false;
        
                      res.redirect("/login");
                } else {
                  res.status(400).send("Failed to update password");
                }
              } else {
                res.status(400).send("New password and confirm password do not match");
              }
            } catch (error) {
              console.log(error);
              res.status(500).send("Internal server error");
            }
          },
           

           //place-order
           

           getPlaceOrder:async(req,res)=>{
            
            let userId=''
            if(req.session.user){
                userId = req.session.user._id
             }
             let user=''
             if(req.session.user){
                user=req.session.user
            }
            let username = req.session.user.username
            let products=await userhelpers.displayProducts(userId)
            
            
            let total=0
            if(products.length>0){
                total=await userhelpers.getTotalAmount(userId)
            }
            
            let cartCount=null
            if(userId){
                cartCount=await userhelpers.getCartCount(userId)
                wishcount = await userhelpers.getWishCount(req.session.user._id);

            }
            
            userhelpers.getAllAddress(userId).then((address)=>{
                
                res.render('user/place-order',{products,total,loginheader:true,cartCount,address,user,userName:username,wishcount})
            })    
           },
           
           postPlaceOrder: async(req, res) => {
             
            let products = await userhelpers.cartOrder(req.body.userId);
            let totalPrice=req.session.newTotal?req.session.newTotal:await userhelpers.getTotalAmount(req.body.userId);

        
             
            userhelpers.placeOrder(req.body, products, totalPrice).then((response)=>{  
      
                let orderId=response._id
                let total=response.total
               if(req.body.paymentMethod==='COD'){
                res.json({codSuccess:true})
               }else{
                   userhelpers.generateRazorpay(orderId,total).then((response)=>{
                
                       res.json(response)
                   })
               }
            }) 
                  
          },

            //ordersuccess

            orderSuccess:async(req,res)=>{
                let username = req.session.user.username
                wishcount = await userhelpers.getWishCount(req.session.user._id);
                res.render('user/order-success',{loginheader:true,userName:username,wishcount})
               },
    

            getOrders:async(req,res)=>{
            let username = req.session.user.username
            if(req.session.user){
                userId = req.session.user._id
               }
               wishcount = await userhelpers.getWishCount(req.session.user._id);
               const cartCount = await userhelpers.getCartCount(userId);
            userhelpers.getUserOrders(userId).then((response)=>{
                res.render('user/orders',{loginheader:true,response,userName:username,cartCount,wishcount})
            })     
            }, 
            
            
            getOrderProducts:async(req,res)=>{
            if(req.session.user){
                userId = req.session.user._id
            }    
            let username = req.session.user.username
            let products=await userhelpers.displayProduct(userId)
            console.log(products,'oom daivame')
            cartCount=await userhelpers.getCartCount(userId)
            wishcount = await userhelpers.getWishCount(req.session.user._id);
            let order=await userhelpers.getShipProducts(req.params.id)
             userhelpers.getShipAddress(req.params.id).then(async(response)=>{
                    res.render('user/view-order-products',{loginheader:true,response,order,userName:username,products,cartCount,wishcount})

                
             })
        },
       
      
        getOrderCancel:async(req,res)=>{
            let userId='';
            if(req.session.user){
                userId = req.session.user._id
            }   
                let orderId=req.params.id
                let order=await userhelpers.getOrder(orderId)
                let refund=order.total
                userhelpers.addToWallet(refund,userId).then((response)=>{
                userhelpers.cancelOrder(orderId).then((response)=>{
                    res.redirect('/orders')
                })
                .catch(error=>{
                    console.error(`the operation failed with error`)
                })
            }).catch(error=>{
                console.error(`the operation failed with error`)
            })
        },

        getOrderReturn:async(req,res)=>{
            let orderId=req.params.id
            let order=await userhelpers.getOrder(orderId)
                let refund=order.total
                userhelpers.addToWallet(refund,userId)
            userhelpers.returnOrder(orderId).then((response)=>{
                res.redirect('/orders')
            }).catch(error=>{
                console.error(`the operation failed with error`)
            })
        },






       verifyPayment:(req,res)=>{     
        userhelpers.verifyPayment(req.body).then((response)=>{
            userhelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
                console.log("Payment Successfull")
                res.json({status:true})
            })
        }).catch((err)=>{
            console.log(err)
            res.json({status:false,errMsg:''})
        })
       },



       //category separation shop
       categoryWork:(req,res)=>{
        let username = req.session.user.username
        userhelpers.getFilerCategory(req.params.id).then((response)=>{
            adminhelpers.findAllcategories().then((cat)=>{
                console.log(response)
                res.render('user/shop',{loginheader:true,response,cat,userName:username})
            })
        })
       },


       applyCoupon: async (req, res) => {
        try {
       

          const couponCode = req.body.code;
          const total = req.body.total;
          console.log("inside apply coupon", total);
          console.log("inside apply coupon", couponCode);
          const coupon = await userhelpers.couponMatch(couponCode);
          console.log(coupon, "ccccoupioj");
          if (
            coupon &&
            coupon.isActive &&
            total >= coupon.minimumAmount &&
            total <= coupon.maximumDiscount
          ) {
            const discount = coupon.discountAmount;
              // coupon.discountType === "percentage"
                // ? (total * coupon.discountAmount) / 100
                // : coupon.discountAmount;
            const newTotal = total - discount;
            req.session.newTotal=newTotal
        
            res.json({ success: true, newTotal, discount });
          } else {
            res.json({ success: false, message: "Invalid coupon code" });
          }
        } catch (error) {
          console.log(error);
          res.json({ success: false, message: "Error applying coupon" });
        }
      },


    

    getWishlist: async (req, res) => {
        userhelpers
          .addToWishList(req.params.id, req.session.user._id)
          .then(() => {
            res.json({
              status: "success"
            });
          });
      
    },
  
    viewWishList: async (req, res) => {
      wishcount = await userhelpers.getWishCount(req.session.user._id);
      let cartCount = await userhelpers.getCartCount(req.session.user._id);
  
      console.log(wishcount, "this is count of wishlist");
      let user = req.session.user.username;
      await userhelpers
        .ListWishList(req.session.user._id)
        .then((wishlistItems) => {
          res.render("user/view-wishlist", {
            wishlistItems,
            wishcount,
            cartCount,
            userName: user,
            loginheader: true,
          });
        });
    },
  
    deleteWishList: async (req, res) => {
      try {
        await userhelpers.getDeleteWishList(req.body).then((response) => {
          res.json(response);
        });
      } catch (error) {
        res.status(500);
      }
    },


    search:()=>{

    }
};

  
   
