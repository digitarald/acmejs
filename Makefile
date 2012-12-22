
PROJECT = rigid-device
PROJECTS = sprites spelleton putpuck
# rigid-device sprites

.PHONY: projects $(PROJECTS)

projects: $(PROJECTS)
	@echo "Projects ..."

$(PROJECTS): coffee
	@echo "Building $@"
	@browserify examples/$@/index.js -o examples/$@/build.js -d -w

coffee:
	@echo "Making .coffee"
	@coffee -bcw ./ ./ &

build:
	@browserify examples/$(PROJECT)/index.js -o examples/$(PROJECT)/build.js -d -w
