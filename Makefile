# default to parallel runs
MAKEFLAGS += -j 6

PROJECT = rigid-device
PROJECTS = b2 spelleton putpuck esl rigid-device

.PHONY: projects $(PROJECTS)

projects: $(PROJECTS)

$(PROJECTS): coffee bundle-test
	@echo "Building $@"
	@browserify examples/$@/index.js -o examples/$@/build.js -d -w

coffee:
	@echo "Making .coffee"
	@coffee -bcw ./ ./ &

bundle-test:
	@echo "Bundling test dependencies"
	@browserify test/core.js -o test/core.build.js -d -w  &

test:
	node test-cloud.js
