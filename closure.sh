java -jar ../closure-compiler.jar \
    --compilation_level=ADVANCED \
    --formatting=PRETTY_PRINT \
    --module_resolution=NODE \
    --warning_level=VERBOSE \
    --language_in=STABLE \
    --language_out=ECMASCRIPT5 \
    --js=src/*.js \
    --js_output_file=dist/bundle.js;