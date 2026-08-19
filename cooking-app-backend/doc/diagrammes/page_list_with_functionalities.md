# <u>Asked functionalities</u>

## Ingredients and meals

* Register a new ingredient

* Ingredient stock management

* Register a new recipe with it's ingredients, description and cost price

* Meal planning with a calendar, with alert if a meal is planned at low day intervals

# <u>Pages</u>

## Ingredient page

- Form to insert a new ingredient
  
  - Name
  
  - Unit used
  
  - Choose type
  
  - Estimated price

- List of existing igredient : 
  
  - Name
  
  - Unit used
  
  - Type name
  
  - Stock left
  
  - Clicking on a row show the details page ->

- The list is with pagination and can be filtered (Name,type, min stock left)

- Endpoints : 
  
  - "ingredients/" POST , body = IngredientData (name, unit, type_id, estimated_price), 
    
    return =>  IngredientRead(id,name,unit,type_id,type_name,estimated_price,stock_left)
  
  - "ingredients/" GET, params (name, type_id, min_stock,pagination_variables)
    
    return => List of IngredientRead(id,name,unit,type_id,type_name,estimated_price,stock_left)
  
  - "ingredients/types/" GET, params(name)
    
    return => List of typeRead(id,name)

## Ingredient details page

* for Modification
  
  * Name
  
  * Unit used
  
  * Ingredient type
  
  * Estimated price

* List of stocks left
  
  * When there is no more ingredient from a purchase, the state of the corresponding stock  will be set to -1
  * Can throw away a stock if damaged or expired( best to avoid xp)

* Form to add stock or ajust it
  
  * Price
  
  * seller
  
  * quantity for it's unit

* endpoints :
  
  * "ingredients/one" GET, params(ingredient_id)
    
    return => IngredientRead(id,name,unit,type_id,type_name,estimated_price,stock_left)
  
  * "ingredients/update" PUT, body = IngredientUpdateData(id,name,unit_used,type_id,estimated_price)
    
    return => IngredientRead(id,name,unit,type_id,type_name,estimated_price,stock_left)
  
  * "ingredients/stock/" GET, params(id)
    
    return => StockRead(id, ingredient_id,ingredient_name,unit_cost,quantity_left, seller_id, seller_name)
  
  * "ingredients/stock/delete" PUT, params(id)
    
    return => StockRead(id, ingredient_id,ingredient_name,unit_cost,quantity_left, seller_id, seller_name)
  
  * "ingredients/sellers/" GET, params(name)
    
    return => List of sellerRead(id,name)

## Recipe page

* List all recipe
  
  * Name
  
  * Description button : Click to show a modal with the description
  
  * Dropdow ingredients with quantity per serving
  
  * Estimated time to make in Hour/min
  
  * Estimated cost price
  
  * button to go to details ->
  
  * button to prepare a meal ->
  
  * Pagination and filters(Name, max time to make,ingredient)

* Form to add a recipe 
  
  * Name
  
  * Description : Big text Area
  
  * Estimated time to make in Hour/min
  
  * parallel_cooking (how many serving can be cooked at the same time)
  
  * Choose the ingredient and the quantity needed per serving

* endpoints : 
  
  * "recipes/" GET, params(name,max_making_time,list of ingredient_id,pagination_variables)
    
    return => RecipeRead(id,name,description,estimated_time,estimated_cost_price, List of RecipeIngredientRead(ingredient_id,ingredient_name,quantity_per_serving,estimated_cost))
  
  * "recipes/" POST, body = RecipeCreate(name,household_id,description,estimated_time,parallel_cooking,list of RecipeIngredientData(ingredient_id,quantity_per_serving))
    
    return => RecipeRead(id,name,description,estimated_time,estimated_cost_price, List of RecipeIngredientRead(ingredient_id,ingredient_name,quantity_per_serving,estimated_cost))
  
  * "ingredients/autocomplete/" GET, params(name)
    
    return => List of ingredientAutocompleteRead(id,name)

## Recipe Details page

* For modification
  
  * Name
  
  * Description button : Click to show a modal with the description for modification
  
  * Estimated time to make in Hour/min
  
  * parallel_cooking

* List of ingredients with quantity per serving
  
  * Each row is modifiable

* endpoints :
  
  - "recipes/one" GET, params(id)
    
    return => RecipeRead(id,name,description,estimated_time,estimated_cost_price, List of RecipeIngredientRead(ingredient_id,ingredient_name,quantity_per_serving,estimated_cost))
  
  - "recipes/" PUT, body = RecipeUpdateData(name,description,estimated_time,parallel_cooking,list of RecipeIngredientData(ingredient_id,quantity_per_serving))
    
    return => RecipeRead(id,name,description,estimated_time,estimated_cost_price, List of RecipeIngredientRead(ingredient_id,ingredient_name,quantity_per_serving,estimated_cost))
  
  - "ingredients/autocomplete/" GET, params(name)
    
    return => List of ingredientAutocompleteRead(id,name)

## Prepare a meal

* Arrive here from choosing a recipe

* Choose the number of serving

* List of ingredients with needed quantities depending on the serving number
  
  * automatically take the needed quantity from oldest purchase but can modify
  
  * Modification : See all stocks left, choose which one with which quantity
  
  * Validation button will be red if chosen quantity doesn t match the needed

* Show the total cost price

* Total estimated time while calculating with parallel cooking

* Validation

* Endpoints :
  
  * "recipes/meals/ " POST, body = MealCreate(recipe_id,nb_serving,list of MealIngredientData(ingredient_stock_id,quantity))
    
    return => MealRead(id,recipe_id,recipe_name,nb_serving,total_cost_price,total_estimated_time)

## Meal planning

* Show a calendar divided by week 

* Each day contain one or more recipe
  
  * Each already made recipe is green
  
  * Button to Prepapre a meal page
  
  * Button to delete a recipe from a day

* Modal to choose recipe(s) for a day
  
  * Same as Recipe page

* Can print a planning (Choose start and end dates)
  
  * Days
  
  * recipes
  
  * Ingredients for one serving of each recipe with estimated price per unit

* endpoints:
  
  * "recipe-planning/ " GET, params(date)
    
    return => List of PlanningRecipeRead(date,recipe_id,recipe_name,is_done,cost_price,estimated_time, list of RecipeIngredientRead)
  
  * "recipe-planning/ " POST, body = RecipePlanningData(household_id,recipe_id,planning_date)
    
    return => PlanningRecipeRead(date,recipe_id,recipe_name,is_done,cost_price,estimated_time, list of RecipeIngredientRead)
  
  * "recipe-planning/ delete-recipe" PUT, params(planning_recipe_id)
    
    return => PlanningRecipeRead(date,recipe_id,recipe_name,is_done,cost_price,estimated_time, list of RecipeIngredientRead)
  
  * "recipes/" GET, params(name,max_making_time,list of ingredient_id,pagination_variables)
    
    return => RecipeRead(id,name,description,estimated_time,unit,type_id,type_name,estimated_cost_price, List of IngredientRead)
  
  * "recipe-planning/print/" GET, params(start_date,end_date) 
    
    return => Pdf  with list of Planning(date, list of RecipeIngredientRead(ingredient_id,ingredient_name,estimated_price,quantity_per_serving)))
