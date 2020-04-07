const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose')
const _ = require('lodash')

const app = express();

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

//-------------------database part--------------------------------//
mongoose.connect('mongodb://127.0.0.1:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: 'welcome to your todo list'
})

const item2 = new Item({
  name: 'press + to add item'
})

const item3 = new Item({
  name: '<-- to delete the item'
})

const defaultItem = [item1, item2, item3]

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = new mongoose.model('List', listSchema)

app.get("/", function (req, res) {

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItem, (err) => {

        if (err) { console.log("Error in insertMany") }
        else { console.log("Successful insertMany") }

      })

      res.redirect('/')
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems })
    }

  })

})

app.get('/:customListName', function (req, res) {

  const customListName = _.capitalize(req.params.customListName)
  List.findOne({ name: customListName }, function (err, foundList) {

    if (!err) {

      if (!foundList) {
        //if given list in not found than it create a new list
        const list = new List({
          name: customListName,
          items: defaultItem
        })
        list.save()
        res.redirect("/" + customListName)
      } else {
        //shows existing list
        res.render('list', { listTitle: foundList.name, newListItems: foundList.items })
      }
    }

  })

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem
  const listName = req.body.list
  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {

    item.save()
    res.redirect("/")

  } else {

    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    })
  }

})

app.post("/delete", function (req, res) {

  const checkBoxItemId = req.body.checkBoxId
  const listName = req.body.listName

  if (listName === "Today") {

    Item.findByIdAndRemove(checkBoxItemId, err => {

      if (err) {
        console.log('Error in delete')
      } else {
        console.log(checkBoxItemId)
        console.log("deleted")
        res.redirect("/")
      }
    })
  } else {//({condition},{update},callback)

    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkBoxItemId } } }, function (err, foundList) {
      if (!err) {
        res.redirect('/' + listName)
      }

    })
  }

})


app.listen(3000, function () {
  console.log("Server started on port 3000")
});
