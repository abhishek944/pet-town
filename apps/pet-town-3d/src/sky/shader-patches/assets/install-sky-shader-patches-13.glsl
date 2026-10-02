$1

	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 skyCloudShadowInv;
		uniform vec4 skyCloudShadowP;
		uniform vec4 skyCloudShadowL;
		uniform vec4 skyCloudShadowW;
		float skyCsHash( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * 0.1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
		float skyCsNoise( vec2 p ) {
			vec2 i = floor( p ), f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f );
			return mix( mix( skyCsHash( i ), skyCsHash( i + vec2( 1, 0 ) ), u.x ), mix( skyCsHash( i + vec2( 0, 1 ) ), skyCsHash( i + vec2( 1, 1 ) ), u.x ), u.y );
		}
		float skyCloudShadow( vec4 sc ) {
			if ( skyCloudShadowP.x <= 0.0 ) return 1.0;
			vec3 uvz = sc.xyz / sc.w;
			vec2 e = abs( uvz.xy - 0.5 ) * 2.0;
			float edge = 1.0 - smoothstep( 0.75, 0.98, max( e.x, e.y ) );
			if ( edge <= 0.0 ) return 1.0;
			vec3 wp = ( skyCloudShadowInv * vec4( uvz, 1.0 ) ).xyz;
			vec3 L = skyCloudShadowL.xyz;
			vec2 p = wp.xz + L.xz * ( ( skyCloudShadowL.w - wp.y ) / max( L.y, 0.15 ) );
			p = ( p + skyCloudShadowW.xy ) * skyCloudShadowP.z;
			float n = skyCsNoise( p ) * 0.55 + skyCsNoise( p * 2.13 + 7.1 ) * 0.3 + skyCsNoise( p * 4.7 + 3.3 ) * 0.15;
			float s = smoothstep( skyCloudShadowP.y, skyCloudShadowP.y + skyCloudShadowP.w, n );
			return 1.0 - s * skyCloudShadowP.x * edge;
		}
	#endif
