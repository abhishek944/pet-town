
#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	vec3 skyFogCol = fogColor;
	float skyFogLen = length( vFogWorldDir );
	vec3 skyFogDir = skyFogLen > 1e-4 ? vFogWorldDir / skyFogLen : vec3( 0.0, 0.0, -1.0 );
	// height-aware haze: thin above the valley floor, thinner along downward (elevated-camera) rays
	float skyFogY = cameraPosition.y + vFogWorldDir.y;
	fogFactor *= exp( - max( 0.0, skyFogY - 9.0 ) / 28.0 );
	fogFactor *= mix( 1.0, 0.35, clamp( - skyFogDir.y * 2.0, 0.0, 1.0 ) );
	// terrain never fully disappears; only near-horizontal rays may reach the full horizon colour
	fogFactor = min( fogFactor, mix( 0.7, 1.0, smoothstep( - 0.08, - 0.01, skyFogDir.y ) ) );
	float skyMu = max( dot( skyFogDir, fogSunDir ), 0.0 );
	skyFogCol += fogSunColor * ( skyMu * skyMu * skyMu * 0.55 + pow( skyMu, 10.0 ) * 0.45 );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, skyFogCol, fogFactor );
#endif
