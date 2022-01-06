const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`
  SELECT * FROM users
  WHERE email = $1
  `, [email])
  .then(
    data => data.rows[0]
  )
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`
  SELECT * 
  FROM users
  WHERE id = $1
  `, [id])
  .then(
    data => data.rows[0]
  )
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
 return pool.query(`
 INSERT INTO users (
  name, email, password) 
  VALUES (
  $1, $2, $3)
  RETURNING *;
 `, [user.name, user.email, user.password])
 .then(
   data => data.rows[0]
 )
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`
  SELECT *
  FROM reservations
  WHERE guest_id = $1
  LIMIT $2
  `, [guest_id, limit])
  .then(
    data => data.rows
  )
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    queryString += `AND cost_per_night > $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `AND cost_per_night < $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `AND rating >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // 1
  const queryParams = [];
  const values = [];

  // 2
  let queryString = `
  INSERT INTO properties(
  `;

  // 3
  if (property.owner_id) {
    queryParams.push(property.owner_id)
    values.push(`$${queryParams.length}`)
    queryString += 'owner_id, ';
  }

  if (property.title) {
    queryParams.push(property.title)
    values.push(`$${queryParams.length}`)
    queryString += 'title, ';
  }

  if (property.description) {
    queryParams.push(property.description)
    values.push(`$${queryParams.length}`)
    queryString += 'description, ';
  }

  if (property.thumbnail_photo_url) {
    queryParams.push(property.thumbnail_photo_url)
    values.push(`$${queryParams.length}`)
    queryString += 'thumbnail_photo_url, ';
  }

  if (property.cover_photo_url) {
    queryParams.push(property.cover_photo_url)
    values.push(`$${queryParams.length}`)
    queryString += 'cover_photo_url, ';
  }

  if (property.cost_per_night) {
    queryParams.push(property.cost_per_night)
    values.push(`$${queryParams.length}`)
    queryString += 'cost_per_night, ';
  }

  if (property.street) {
    queryParams.push(property.street)
    values.push(`$${queryParams.length}`)
    queryString += 'street, ';
  }

  if (property.city) {
    queryParams.push(property.city)
    values.push(`$${queryParams.length}`)
    queryString += 'city, ';
  }

  if (property.province) {
    queryParams.push(property.province)
    values.push(`$${queryParams.length}`)
    queryString += 'province, ';
  }

  if (property.post_code) {
    queryParams.push(property.post_code)
    values.push(`$${queryParams.length}`)
    queryString += 'post_code, ';
  }

  if (property.country) {
    queryParams.push(property.country)
    values.push(`$${queryParams.length}`)
    queryString += 'country, ';
  }

  if (property.parking_spaces) {
    queryParams.push(property.parking_spaces)
    values.push(`$${queryParams.length}`)
    queryString += 'parking_spaces, ';
  }

  if (property.number_of_bathrooms) {
    queryParams.push(property.number_of_bathrooms)
    values.push(`$${queryParams.length}`)
    queryString += 'number_of_bathrooms, ';
  }

  if (property.number_of_bedrooms) {
    queryParams.push(property.number_of_bedrooms)
    values.push(`$${queryParams.length}`)
    queryString += 'number_of_bedrooms, ';
  }

  // remove trailing space and comma
  queryString = queryString.slice(0, -2);

  // add values to queryString
  queryString +=
  `) 
  VALUES (
  `;

  for (let i = 0; i < values.length; i++) {
    queryString += values[i] + ', '
  }

  // remove trailing space and comma
  queryString = queryString.slice(0, -2);

  queryString += 
  `)
  RETURNING *;`;

  // 5
  return pool.query(queryString, queryParams)
  .then(
    data => data.rows[0]
  )
}
exports.addProperty = addProperty;
