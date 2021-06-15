const express = require('express');
const bodyParser = require("body-parser")
const date = require(__dirname + "/date.js")
const app = express();
const mongoose = require('mongoose');
const lodash=require("lodash");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://mb-admin:mb-admin@cluster0.qokx2.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);

const itemsSchema = {
  name: String
}

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to todo List"
})
const item2 = new Item({
  name: "Hit + to add new item"
})
const item3 = new Item({
  name: "You can delete your list item anytime"
})

const defaultItem = [item1, item2, item3];

const listSchema={
  name: String,
  items:[itemsSchema]
}

const List=mongoose.model("list",listSchema);

app.get('/', (req, res) => {
  //const day = date.getDate();
  Item.find({}, function (err, foundItems) {
  if(foundItems.length===0){
    Item.insertMany(defaultItem, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfuly added default items in list");
      }
    })
    res.redirect("/");
  }else{
    res.render("list", { title: "Today", listOfItems: foundItems });
  }
})
});

app.get("/:customListName",function (req,res) {
  const customListName=lodash.capitalize(req.params.customListName);

  List.findOne({name:customListName},function (err,foundList) {
    if(!err){
      if(!foundList){
        // create list
        const list=new List({
          name:customListName,
          items:defaultItem
        })
        list.save();
        res.redirect("/"+customListName);
        
      }else{
        // show an existing list
        res.render("list",{title:foundList.name,listOfItems:foundList.items})
      }
    }
    
  })
  
  
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName=req.body.list;
  
  const item=new Item({
    name:itemName
  })
  if(listName=== "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function (err,foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }


})

app.post("/delete",function (req,res) {
  const checkedId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedId,function (err) {
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedId}}},function (err,foundList) {
      res.redirect("/"+listName);
    });
  }
})

let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}

app.listen(port,()=>{
  console.log("Runnig on heroku");
})

//app.listen(3000, () => console.log('Example app listening on port 3000!'));
