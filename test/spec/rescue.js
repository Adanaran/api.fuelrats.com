var app, chai, expect, generate, request, rootUrl, superagent;





// Imports
// =============================================================================

//app = require( '../../api.js' );
chai = require( 'chai' );
//request = require( 'express-mock-request' );
superagent = require( 'superagent' );
expect = chai.expect;

generate = require( '../generator' );





// Set up globals
// =============================================================================

rootUrl = 'http://localhost:8080/api';





// Before and After hooks
// =============================================================================





// PULL THE LEVER!
// =============================================================================

describe( 'Rescue Endpoints', function () {
  describe( 'POST /api/rescues', function () {
    var rescue;

    // Create a rescue object
    rescue = generate.randomRescue();

    it( 'should create a new rescue', function ( done ) {

      superagent
      .post( rootUrl + '/rescues' )
      .send( rescue )
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        // Make sure the POST succeeded
        expect( response.status ).to.equal( 201 );

        // Make sure there are no errors
        expect( response.body ).to.not.have.property( 'errors' );

        // Make sure our response is correctly constructed
        expect( response.body.data ).to.be.an( 'object' );

        // Check all of the properties on the returned object
        expect( response.body.data.client.CMDRname ).to.equal( rescue.client.CMDRname );
        expect( response.body.data.client.nickname ).to.equal( rescue.client.nickname );
        expect( response.body.data.codeRed ).to.equal( rescue.codeRed );
        expect( response.body.data.nearestSystem ).to.equal( rescue.nearestSystem );
        expect( response.body.data.platform ).to.equal( rescue.platform );

        done();
      });
    });
  });





  describe( 'GET /api/rescues', function () {

    it( 'should return a list of rescues', function ( done ) {
      superagent
      .get( rootUrl + '/rescues' )
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        // Make sure the GET succeeded
        expect( response.status ).to.equal( 200 );

        // Make sure there are no errors
        expect( response.body ).to.not.have.property( 'errors' );

        // Make sure our response is correctly constructed
        expect( response.body.data ).to.be.an( 'array' );

        done( error );
      });
    });
  });









  describe( 'GET /api/rescues/:id', function () {

    var rescue;

    // Create a rescue object
    rescue = generate.randomRescue();

    // Create a new rescue to test against
    before( function ( done ) {
      superagent
      .post( rootUrl + '/rescues' )
      .send( rescue )
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        rescue.id = response.body.data.id;

        done();
      });
    });

    it( 'should return a rescue', function ( done ) {
      superagent
      .get( rootUrl + '/rescues/' + rescue.id )
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        // Make sure the request succeeded
        expect( response.status ).to.equal( 200 );

        // Make sure there are no errors
        expect( response.body ).to.not.have.property( 'errors' );

        // Make sure our response is correctly constructed
        expect( response.body.data ).to.be.an( 'object' );

        // Make sure our response has the right data
        expect( response.body.data.id ).to.equal( rescue.id );

        done();
      });
    });
  });





  describe( 'PUT /api/rescues/:id', function () {
    var rescue;

    // Create a new rescue to test against
    before( function ( done ) {
      superagent
      .post( rootUrl + '/rescues' )
      .send( generate.randomRescue() )
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        rescue = response.body.data;

        done();
      });
    });

    it( 'should update a rescue', function ( done ) {
      superagent
      .put( rootUrl + '/rescues/' + rescue.id )
      .send({
        nickname: 'Edited Test Client ' + ( Date.now() - parseInt( ( Math.random() * Math.random() ) * 1000000 ) ).toString( 36 )
      })
      .end( function ( error, response ) {
        if ( error ) {
          return done( error );
        }

        // Make sure the POST succeeded
        expect( response.status ).to.equal( 200 );

        done();
      });
    });
  });
});