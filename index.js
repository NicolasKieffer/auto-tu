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
 *   - [Object] subject : Objet à tester
 *   - [Object] dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - [Object] wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 * @return {null}
 */
myObject.start = function(options) {
  describe(options.description, function() {
    myObject.mapKeys({
      object: options.subject,
      namespace: 'this',
      dataset: options.dataset,
      wrapper: options.wrapper
    });
  });
};

/**
 * Parcours les paramètres d'une vairiable à la recherche de propriétés de type Function
 * @param {Obecjt} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - [String] namespace : Namespace de la fonction à tester
 *   - [Object] subject : Objet à parcourir
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
        // Si c'est une fonction, on la test
        myObject.run({
          data: options.dataset[key],
          fn: options.subject[key],
          namespace: options.namespace + '.' + key,
          wrapper: options.wrapper[key]
        });
      } else {
        // Sinon, on le map à nouveau
        myObject.mapKeys({
          dataset: options.dataset[key],
          namespace: options.namespace + '.' + key,
          object: options.subject[key],
          wrapper: options.wrapper[key]
        });
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
 *   - [Object] subject : Objet à parcourir
 *   - [Object] dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - [Object] wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 * @return {null}
 */
myObject.run = function(options) {
  if (typeof options.test === 'function') {
    describe('#' + options.namespace + '()', function() {
      async.eachSeries(options.data, function(item, callback) {
        it(item.label, function(done) {
          // Transforme les string en regex si nécessaire
          if (item.regExp) {
            myObject.setRegex(item.regExp, item.options);
          }
          // Ajoute le wrapper par défaut si nécessaire
          if (!options.wrapper) {
            options.wrapper = myObject.wrapper;
          }
          myObject.test(options.wrapper(options.fn, item), item.result);
          return done();
        });
        return callback();
      });
    });
  }
};

myObject.wrapper = function(fn, item) {
  return fn(item.arguments);
};

/**
 * Permet d'effecetuer le test correspondant au résultat souhaité (se base sur les propriétés de la variable résult)
 * @param {} value Valeur à tester, peut importe le type
 * @param {Object} result Variable indiquant le résultat souhaité :
 *   - [Boolean] typeof : Indique que l'on souhaite tester le typeof du résultat
 *   - [Boolean] length : Indique que l'on souhaite tester 'have.length'
 *   - [Boolean] not : Indique que l'on souhaite tester 'not.equal'
 * @return {Object} Résultat du test
 */
myObject.test = function(value, result) {
  if (result.not) {
    // Si on doit tester que la valeur retournée n'est pas égale à
    return expect(value).to.not.equal(result.value);
  } else if (result.length) {
    // Si on doit tester la longueur la valeur retournée
    return expect(value).to.have.length(result.value);
  } else if (result.typeof) {
    // Si on doit tester que le type de la valeur retournée n'est pas égale à
    return expect(typeof result).to.equal(result.value);
  }
  // Si on doit tester que la valeur retournée est pas égale à
  return expect(value).to.equal(result.value);
};

module.exports = object;