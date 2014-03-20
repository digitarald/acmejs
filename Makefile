COMPONENT = node_modules/component/bin/component
SERVER = node_modules/http-server/bin/http-server
JSDOC = node_modules/jsdoc/nodejs/bin/jsdoc
DOCSTRAP = node_modules/ink-docstrap/template

build:
	@component build --dev
	@perl -pi -w -e 's/\/\/@/\/\/#/g;' build/build.js
	@echo "✔ build/build.js"

acme.js: node_modules components
	@echo "✔ acmejs.js"
	@$(COMPONENT) build --out . --name acmejs

components: component.json
	@component install --dev

node_modules: package.json
	@npm install

clean:
	@rm -rf components build node_modules

server: node_modules
	@echo "Serving http://localhost:8000"
	@$(SERVER) ./ -p 8000 -s

deploy:
	@echo "✔ Deployed gh-pages"
	@git push -f origin HEAD:gh-pages

# depends on `watchr`:
#   gem install watchr && gem install ruby-fsevent
watch: build
	@echo "Watching lib/*.js"
	@watchr -e "watch('lib/.*\.js') { system 'make build' }"

docs:
	@$(JSDOC) lib/* -t $(DOCSTRAP) -c $(DOCSTRAP)/jsdoc.conf.json

.PHONY: build
