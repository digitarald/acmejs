
coffee:
	@echo "Making .coffee"
	@./node_modules/.bin/coffee -b -c -w ./ ./ &

grunt: coffee
	grunt

test:
	node test-cloud.js

server:
	python -m SimpleHTTPServer

deploy:
	# assume there is something to commit
	# use "git diff --exit-code HEAD" to know if there is something to commit
	# so two lines: one if no commit, one if something to commit
	git commit -a -m "New deploy" && git push -f origin HEAD:gh-pages && git reset HEAD~

# default to parallel runs
# MAKEFLAGS += -j 6

# PROJECT = rigid-device
# PROJECTS = b2 spelleton putpuck bench

# .PHONY: projects $(PROJECTS)

# projects: $(PROJECTS)

# $(PROJECTS): coffee
#	@echo "Building $@"
#	@./node_modules/.bin/browserify examples/$@/index.js -o examples/$@/build.js -d -w -v
