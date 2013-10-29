build: components index.js
	@component build --dev
	@perl -pi -w -e 's/\/\/@/\/\/#/g;' build/build.js

components: component.json
	@component install --dev

clean:
	rm -fr build components

server:
	@echo "Starting test-server: http://localhost:8000"
	@open http://localhost:8000/examples/
	@python -m SimpleHTTPServer

deploy:
	@echo "Deploying to gh-pages"
	# assume there is something to commit
	# use "git diff --exit-code HEAD" to know if there is something to commit
	# so two lines: one if no commit, one if something to commit
	@git commit -a -m "New deploy" && git push -f origin HEAD:gh-pages && git reset HEAD~

deploy-soft:
	git push -f origin HEAD:gh-pages

# depends on `watchr`:
#   gem install watchr
#   gem install ruby-fsevent
watch: build
	@echo "Watching lib/*"
	@watchr -e "watch('lib/.*\.js') { system 'make build' }"

.PHONY: build