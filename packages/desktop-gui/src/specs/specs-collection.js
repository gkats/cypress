import _ from 'lodash'
import { observable, action } from 'mobx'

import Spec from './spec-model'

export class SpecsCollection {
  @observable specs = []
  @observable error = null
  @observable isLoading = false
  @observable isLoaded = false
  @observable allSpecsChosen = false

  @action loading (bool) {
    this.isLoading = bool
  }

  @action setSpecs (specs) {
    this.specs = this.resetToTreeView(specs)

    this.isLoading = false
    this.isLoaded = true
  }

  @action setChosenSpec (specPath) {
    if (specPath === '__all') {
      this.allSpecsChosen = true
    } else {
      this.allSpecsChosen = false
    }

    function setChosen (specs) {
      _.forEach(specs, (spec) => {
        // we're a file if we have no child specs
        if (!spec.children.specs.length && (spec.name === specPath || spec.path === specPath)) {
          spec.isChosen = true
        } else {
          spec.isChosen = false
          setChosen(spec.children.specs)
        }
      })
    }

    setChosen(this.specs)
  }


  findByDisplayName (specs, path) {
    return _.find(specs, (spec) => (spec.displayName === path))
  }

  getFilesSplitByDirectory (specs) {
    return _.map(specs, (spec) => (spec.name.split("/")))
  }

  resetToTreeView (specs) {
    let specsTree = new SpecsCollection([])

    _.forEach(specs, (arr, key) => {
      _.forEach(this.getFilesSplitByDirectory(arr), (segments, index) => {
        // add the 'key' to the beginning of the segment
        // so it prepend 'unit' or 'integration'
        segments.unshift(key)

        _.reduce(segments, (memo, segment) => {
          // grab the original object
          // at index so we can find its path
          let obj = arr[index]

          // attempt to find an existing spec
          // on the specs memo by its segment
          let spec = memo.findByDisplayName(memo.specs, segment)

          // if its not found then we know we need to
          // push a new spec into the specs memo
          if (!spec) {
            spec = new Spec({
              name: segments.join('/'),
              displayName: segment,
            })

            memo.specs.push(spec)
          }

          spec.path = obj.path

          // and always return the spec's children
          return spec.children

        }, specsTree)
      })
    })


    return specsTree.specs
  }
}

export default new SpecsCollection()