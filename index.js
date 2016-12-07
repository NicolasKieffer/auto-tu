/* global module */
/* jslint node: true */
/* jslint indent: 2 */
'use strict';

var async = require('async'),
  expect = require('chai').expect;

var myObject = {};

/**
 * Démarre les TU
 * @param {Obecjt} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - [String] description : Description des TU
 *   - [String] root : Racine du namespace
 *   - [Object] object : Objet à tester
 *   - [Object] dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - [Object] wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 * @return {null}
 */
myObject.start = function(options) {
  describe(options.description, function() {
    myObject.mapKeys({
      object: options.object,
      namespace: options.root,
      dataset: options.dataset,
      wrapper: options.wrapper
    });
  });
};

/**
 * Parcours les paramètres d'une vairiable à la recherche de propriétés de type Function
 * @param {Obecjt} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - [String] namespace : Namespace de la fonction à tester
 *   - [Object] object : Objet à parcourir
 *   - [Object] dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - [Object] wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 * @return {null}
 */
myObject.mapKeys = function(options) {
  // Si la propriété est un object, on le parcours
  if (typeof options.object === 'object') {
    // Pour chaque clé
    async.eachSeries(Object.keys(options.object), function(key, callback) {
      if (typeof options.object[key] === 'function') {
        // Si c'est une fonction, on peut donc la tester
        if (options.dataset) {
          // Si un jeu de donnée est présent on lance le test
          myObject.run({
            data: options.dataset[key],
            fn: options.object[key],
            namespace: options.namespace + '.' + key,
            wrapper: options.wrapper[key]
          });
        }
      } else {
        // Sinon, on essaye de le mapper à nouveau
        if (typeof options.object[key] === 'object') {
          myObject.mapKeys({
            dataset: options.dataset[key],
            namespace: options.namespace + '.' + key,
            object: options.object[key],
            wrapper: options.wrapper[key]
          });
        }
      }
      return callback();
    });
  }
  // Sinon on ne fait rien
  return null;
};

/**
 * Parcours les paramètres d'une vairiable à la recherche de propriétés de type Function
 * @param {Obecjt} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - [String] namespace : Namespace de la fonction à tester
 *   - [Object] data : Données de test
 *   - [Function] fn : Fonction à tester
 *   - [Function] wrapper : Wrapper permettant d'appeler correctement la fonction à tester
 * @return {null}
 */
myObject.run = function(options) {
  if (typeof options.fn === 'function') {
    describe('#' + options.namespace + '()', function() {
      async.eachSeries(options.data, function(item, callback) {
        it(item.label, function(done) {
          // Ajoute le wrapper par défaut si nécessaire
          if (!options.wrapper) {
            options.wrapper = myObject.wrapper;
          }
          options.wrapper(options.fn, item, function(result) {
            myObject.test(result, item.result);
            return done();
          })
        });
        return callback();
      });
    });
  }
};

myObject.wrapper = function(fn, item, cb) {
  return cb(fn(item.arguments));
};

/**
 * Permet d'effecetuer le test correspondant au résultat souhaité (se base sur les propriétés de la variable résult)
 * @param {} value Valeur à tester, peut importe le type
 * @param {Object} result Variable indiquant le résultat souhaité :
 *   - [Boolean] not : Indique que l'on souhaite tester 'not.'
 *   - [Boolean] include : Indique que l'on souhaite tester 'include'
 *   - [Boolean] length : Indique que l'on souhaite tester 'to.have.length'
 *   - [Boolean] property : Indique que l'on souhaite tester 'to.have.property'
 *   - [Boolean] be : Indique que l'on souhaite tester 'to.be.a'
 *   - Par défaut, test de 'to.equal'
 * @return {Object} Résultat du test
 */
myObject.test = function(value, result) {
  var res = expect(value);
  // Test que la valeur retournée est inclue dans le résultat
  if (result.include) return res.include(value);
  res = res.to;
  // Test que la valeur retournée n'est pas égale au résultat
  if (result.not) res = res.not;
  // Test de la longueur
  if (result.length) return res.have.length(result.value);
  // Test de la propriété
  if (result.property) return res.have.property(result.value);
  // Test du type
  if (result.be) return res.be.a(result.value);
  // Test de la valeur
  return res.equal(result.value);
};

module.exports = myObject;