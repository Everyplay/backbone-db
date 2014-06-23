ENV = test
REPORTER = spec
BIN = node_modules/.bin
SRC_FILES = $(shell find .  -type f \( -name "*.js" ! \
	-path "*node_modules*" ! -path "*lcov-report*" \))

MOCHA-OPTS = --reporter $(REPORTER) \
		--require chai \
		--ui bdd \
		--recursive \
		--colors

test: jshint
	@NODE_ENV=$(ENV) $(BIN)/mocha \
		$(MOCHA-OPTS) test/interface.test.js
.PHONY: test

jshint:
	@$(BIN)/jshint $(SRC_FILES)
