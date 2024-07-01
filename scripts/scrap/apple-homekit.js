import _ from "lodash"
import axios from "axios"
import * as cheerio from 'cheerio';
// import { JSDOM } from "jsdom"
import fs from "fs"
import yaml from "yaml"

const URL = "https://www.apple.com/home-app/accessories"
const ROOT = `${process.cwd()}/data`
console.log("ROOT:", ROOT)

const HARDCODED_EXCEPTIONS = {
  "Garage Door Openers": {
    slug: "garage-doors",
    name: "Garage Doors",
  }
}


const main = async () => {
  const page = await axios.get(URL)
  const $ = cheerio.load(page.data, null, false)
  const categories = Array.from($(".feature-label")).map(p => {
    const name = $(p).text()

    return {
      slug: _.kebabCase(name),
      name,
      long_name: name,
      excerpt: "",
      description: "",
      comparison_criteria: []
    }
  })

  const products = Array.from($(".row-logical")).map(div => {
    const $category = $(div)
    const categoryName = $category.find("h2").text()
    // const categorySlug = _.kebabCase(categoryName)
    let category = categories.find(ctg => categoryName.startsWith(ctg.name) || categoryName.endsWith(ctg.name) || categoryName.includes(ctg.name))
    if (!category && HARDCODED_EXCEPTIONS[categoryName]) category = HARDCODED_EXCEPTIONS[categoryName]
    if (!category) console.warn("MISSING CATEGORY:", categoryName)
    if (category) category.long_name = categoryName


    return Array.from($category.find("li")).map(li => {
      const $li = $(li)
      const name = $li.text()
      const slug = _.kebabCase(name)

      return {
        category: category.slug,
        slug,
        name,
        official_url: "",
        amazon: {
          url: "",
          price: 0,
          rating_average: 0,
          rating_amount: 0,
          best_seller_rank: 0,
          best_seller_category: "",
          comments: [],
        },
        integrations: {
          apple_home_kit: true,
          google_home: null,
          open_hab: null,
          home_assistant: null,
          io_broker: null,
        },
        pros: [],
        cons: [],
        excerpt: "",
        long_description: "",
      }
    })
  }).flat()

  while (categories.length) {
    const category = categories.pop()

    fs.writeFileSync(`${ROOT}/categories/${category.slug}.yml`, yaml.stringify(category))
  }

  while (products.length) {
    const product = products.pop()

    fs.writeFileSync(`${ROOT}/products/${product.slug}.yml`, yaml.stringify(product))
  }

  // console.log("categories:", categories)
  // console.log("products:", products)
  // console.log("doc:", doc)
  // const $categories = doc.querySelectorAll(".feature-label")
  // console.log("$categories:", $categories)
  // console.info(categories)
}

main()
