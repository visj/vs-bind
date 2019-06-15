java -jar ../closure-compiler.jar \
    --compilation_level=ADVANCED \
    --module_resolution=NODE \
    --warning_level=VERBOSE \
    --language_in=STABLE \
    --language_out=ECMASCRIPT5 \
    --js=src/*.js \
    --js_output_file=src/bundle.js;