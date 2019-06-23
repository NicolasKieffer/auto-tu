/* global module */
/* jslint node: true */
/* jslint indent: 2 */
'use strict';

const async = require('async'),
  expect = require('chai').expect,
  child_process = require('child_process');

const myObject = {};

/**
 * Démarre les TU
 * @param {object} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - {string} description : Description des TU
 *   - {string} root : Racine du namespace
 *   - {object} object : Objet à tester
 *   - {object} dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - {object} wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 *   - {function} beforeEach : Fonction à exécuter avant chaque itération
 *   - {function} afterEach : Fonction à exécuter après chaque itération
 *   - {function} before : Fonction à exécuter avant la première itération
 *   - {function} after : Fonction à exécuter après la dernière itération
 * @param {function} callback Callback qui devrait être appelée aprés le traitement (optionnel)
 * @return {undefined} Return undefined
 */
myObject.start = function(options) {
  return describe(options.description, function() {
    return myObject.mapKeys({
      'object': options.object,
      'namespace': options.root,
      'dataset': options.dataset,
      'wrapper': options.wrapper,
      'beforeEach': options.beforeEach ? options.beforeEach : {},
      'afterEach': options.afterEach ? options.afterEach : {},
      'before': options.before ? options.before : {},
      'after': options.after ? options.after : {}
    });
  });
};

/**
 * Parcours les paramètres d'une vairiable à la recherche de propriétés de type Function
 * @param {object} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - {string} namespace : Namespace de la fonction à tester
 *   - {object} object : Objet à parcourir
 *   - {object} dataset : Objet qui contient toutes les valeurs qui seront envoyées aux différentes fonctions à tester
 *   - {object} wrapper : Objet qui contient les wrapper à utilisé pour lancer le test sur la fonction
 *   - {function} beforeEach : Fonction à exécuter avant chaque itération
 *   - {function} afterEach : Fonction à exécuter après chaque itération
 *   - {function} before : Fonction à exécuter avant la première itération
 *   - {function} after : Fonction à exécuter après la dernière itération
 * @return {undefined} Return undefined
 */
myObject.mapKeys = function(options) {
  // Si la propriété est un object, on le parcours
  if (typeof options.object === 'object') {
    // Pour chaque clé
    return async.eachSeries(Object.keys(options.dataset), function(key, callback) {
      // Si c'est une fonction, on peut donc la tester
      if (typeof options.object[key] === 'function') {
        // Si un jeu de donnée est présent on lance le test
        if (options.dataset[key]) {
          myObject.run({
            'data': options.dataset[key],
            'fn': options.object[key].bind(options.object),
            'namespace': options.namespace + '.' + key,
            'wrapper': options.wrapper[key],
            'beforeEach': options.beforeEach[key] ? options.beforeEach[key] : {},
            'afterEach': options.afterEach[key] ? options.afterEach[key] : {},
            'before': options.before[key] ? options.before[key] : {},
            'after': options.after[key] ? options.after[key] : {}
          });
        }
      } else {
        // Sinon, on essaye de le mapper à nouveau
        if (typeof options.object[key] === 'object') {
          myObject.mapKeys({
            'dataset': options.dataset[key],
            'namespace': options.namespace + '.' + key,
            'object': options.object[key],
            'wrapper': options.wrapper[key],
            'beforeEach': options.beforeEach[key] ? options.beforeEach[key] : {},
            'afterEach': options.afterEach[key] ? options.afterEach[key] : {},
            'before': options.before[key] ? options.before[key] : {},
            'after': options.after[key] ? options.after[key] : {}
          });
        }
      }
      return callback();
    });
  }
};

/**
 * Parcours les paramètres d'une vairiable à la recherche de propriétés de type Function
 * @param {object} options Tous les paramètres permettant de lancer les TU à savoir :
 *   - {string} namespace : Namespace de la fonction à tester
 *   - {object} data : Données de test
 *   - {function} fn : Fonction à tester
 *   - {function} wrapper : Wrapper permettant d'appeler correctement la fonction à tester
 *   - {function} beforeEach : Fonction à exécuter avant chaque itération
 *   - {function} afterEach : Fonction à exécuter après chaque itération
 *   - {function} before : Fonction à exécuter avant la première itération
 *   - {function} after : Fonction à exécuter après la dernière itération
 * @return {undefined} Return undefined
 */
myObject.run = function(options) {
  if (typeof options.fn === 'function') {
    return describe('#' + options.namespace + '()', function() {
      if (typeof options.beforeEach === 'function') beforeEach(options.beforeEach);
      if (typeof options.afterEach === 'function') afterEach(options.afterEach);
      if (typeof options.before === 'function') before(options.before);
      if (typeof options.after === 'function') after(options.after);
      return async.eachSeries(options.data, function(item, callback) {
        it(item.label, function(done) {
          // Ajoute le wrapper par défaut si nécessaire
          if (!options.wrapper) options.wrapper = myObject.wrapper;
          // Lancement du test
          return options.wrapper(options.fn, item, function(result) {
            myObject.test(result, item.result);
            return done();
          });
        });
        return callback();
      });
    });
  }
};

/**
 * Wrapper par défaut
 * @param {function} fn Fonction à tester
 * @param {object} item Item en cours
 * @param {function} cb Callback appelée à la fin du traitement, avec comme paramètre disponible :
 *  - {} value Valeur à tester
 * @return {undefined} Return undefined
 */
myObject.wrapper = function(fn, item, cb) {
  return cb(fn(item.arguments));
};

/**
 * Permet d'effectuer le test correspondant au résultat souhaité (se base sur les propriétés de la variable résult)
 * @param {} value Valeur à tester, peut importe le type
 * @param {object} result Variable indiquant le résultat souhaité :
 *   - not : Indique que l'on souhaite tester 'not.'
 *   - include : Indique que l'on souhaite tester 'include'
 *   - length : Indique que l'on souhaite tester 'to.have.length'
 *   - property : Indique que l'on souhaite tester 'to.have.property'
 *   - be : Indique que l'on souhaite tester 'to.be.a'
 *   - equal : Indique que l'on souhaite tester de 'to.equal'
 * @return {object} Résultat du test
 */
myObject.test = function(value, result) {
  let res = expect(value);
  // Test que la valeur retournée est inclue dans le résultat
  if (typeof result.include !== 'undefined') return res.include(result.include);
  res = res.to;
  // Test que la valeur retournée n'est pas égale au résultat
  if (typeof result.not !== 'undefined') res = res.not;
  // Test de la valeur
  if (typeof result.equal !== 'undefined') return res.equal(result.equal);
  // Test de la longueur
  if (typeof result.length !== 'undefined') return res.have.length(result.length);
  // Test de la propriété
  if (typeof result.property !== 'undefined') return res.have.property(result.property);
  // Test du type
  if (typeof result.be !== 'undefined') return res.be.a(result.be);
};

/**
 * Permet de tester si le(s) package(s) est(sont) disponible(s) sur la machine
 * @param {object} options Variable indiquant les données suivantes :
 *   - packages : {array} Liste des noms de packages à tester
 *   - description : {string} [Optional] Description du test
 * @return {undefined} Return undefined
 */
myObject.which = function(options) {
  let description =
    options.description ||
    'Test de la présence sur la machine du/des package(s) suivant(s) : ' + options.packages.join(', ');
  return describe(description, function() {
    return async.eachSeries(options.packages, function(item, callback) {
      it(item, function(done) {
        let res = {
            stdout: [],
            stderr: []
          },
          err = null;
        // Spawn du process qui vérifie la présence du paquet
        let child = child_process.spawn('which', [item], {
          cwd: __dirname
        });
        // Write stdout in Logs
        child.stdout.on('data', function(data) {
          let str = data.toString();
          res.stdout.push(str);
        });
        // Write stderr in Logs
        child.stderr.on('data', function(data) {
          let str = data.toString();
          res.stderr.push(str);
        });
        // Write error process in Logs
        child.on('error', function(data) {
          let str = data.toString();
          if (!err) err = [];
          err.push(str);
        });
        // On close of process
        child.on('close', function(code) {
          if (!err) {
            myObject.test(res.stdout.length > 0, {
              'equal': true
            });
          } else {
            console.log({
              'package': item,
              'error': err,
              'res': res,
              'code': code
            });
          }
          return done();
        });
      });
      return callback();
    });
  });
};

module.exports = myObject;
