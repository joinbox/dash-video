

	var type = require( "./" );



	console.log( type.string( "some string" ) );
	console.log( type.number( new Number(55) ) );
	console.log( type.boolean( false ) );
	console.log( type.function( function(){} ) );
	console.log( type.object( {} ) );
	console.log( type.date( new Date() ) );
	console.log( type.error( new Error() ) );
	console.log( type.regexp( /gg/ ) );
	console.log( type.array( [] ) );
	console.log( type.null( null ) );
	console.log( type.undefined() );
	console.log( type.buffer( new Buffer( "hi" ) ) );



	console.log(
		  type( "ee" )
		, type( /f/ )
		, type( undefined )
		, type( true )
		, type( new Error( "oo" ) )
		, type( function(){} )
		, type( new Buffer( "w2" ) )
		, type( null )
		, type( new Date() )
		, type( new Number(3) )
		, type( [] )
		, type( {} ) );
