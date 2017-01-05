/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const EventEmitter = require('events');
const Resource = require('@ibm/ibm-concerto-common').Resource;

/**
 * A class for managing and persisting resources.
 * @protected
 */
class Registry extends EventEmitter {

    /**
     * Constructor.
     * @param {string} dataCollection The data collection to use.
     * @param {Serializer} serializer The serializer to use.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     */
    constructor(dataCollection, serializer, type, id, name) {
        super();
        this.dataCollection = dataCollection;
        this.serializer = serializer;
        this.type = type;
        this.id = id;
        this.name = name;
    }

    /**
     * Get all the resources in this registry.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} objects when complete, or rejected with an error.
     */
    getAll() {
        return this.dataCollection.getAll()
            .then((resources) => {
                return resources.map((resource) => {
                    return this.serializer.fromJSON(resource);
                });
            });
    }

    /**
     * Get the specified resource in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * object when complete, or rejected with an error.
     */
    get(id) {
        return this.dataCollection.get(id)
            .then((resource) => {
                return this.serializer.fromJSON(resource);
            });
    }

    /**
     * Determine whether the specified resource exists in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the asset exists.
     */
    exists(id) {
        return this.dataCollection.exists(id);
    }

    /**
     * An event signalling that a resource has been added to this registry.
     * @event Registry#resourceadded
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} resource The resource.
     */

    /**
     * Add all of the specified resources to this registry.
     * @param {Resource[]} resources The resources to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    addAll(resources, options) {
        options = options || {};
        return resources.reduce((result, resource) => {
            return result.then(() => {
                let id = resource.getIdentifier();
                let object = this.serializer.toJSON(resource, {
                    convertResourcesToRelationships: options.convertResourcesToRelationships
                });
                this.emit('resourceadded', {
                    registry: this,
                    resource: resource
                });
                return this.dataCollection.add(id, object);
            });
        }, Promise.resolve());
    }

    /**
     * Add the specified resource to this registry.
     * @param {Resource} resource The resource to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    add(resource, options) {
        options = options || {};
        let id = resource.getIdentifier();
        let object = this.serializer.toJSON(resource, {
            convertResourcesToRelationships: options.convertResourcesToRelationships
        });
        this.emit('resourceadded', {
            registry: this,
            resource: resource
        });
        return this.dataCollection.add(id, object);
    }

    /**
     * An event signalling that a resource has been updated in this registry.
     * @event Registry#resourceupdated
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} oldResource The old version of the resource.
     * @param {Resource} newResource The new version of the resource.
     */

    /**
     * Update all of the specified resources in this registry.
     * @param {Resource[]} resources The resources to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    updateAll(resources, options) {
        options = options || {};
        return resources.reduce((result, resource) => {
            return result.then(() => {
                let id = resource.getIdentifier();
                return this.get(id)
                    .then((oldResource) => {
                        let object = this.serializer.toJSON(resource, {
                            convertResourcesToRelationships: options.convertResourcesToRelationships
                        });
                        this.emit('resourceupdated', {
                            registry: this,
                            oldResource: oldResource,
                            newResource: resource
                        });
                        return this.dataCollection.update(id, object);
                    });
            });
        }, Promise.resolve());
    }

    /**
     * Update the specified resource in this registry.
     * @param {Resource} resource The resource to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    update(resource, options) {
        options = options || {};
        let id = resource.getIdentifier();
        let object = this.serializer.toJSON(resource, {
            convertResourcesToRelationships: options.convertResourcesToRelationships
        });
        return this.get(id)
            .then((oldResource) => {
                this.emit('resourceupdated', {
                    registry: this,
                    oldResource: oldResource,
                    newResource: resource
                });
                return this.dataCollection.update(id, object);
            });
    }

    /**
     * An event signalling that a resource has been removed from this registry.
     * @event Registry#resourceremoved
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {string} resourceID The ID of the resource.
     */

    /**
     * Remove all of the specified resources from this registry.
     * @param {string[]|Resource[]} resources The resources to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    removeAll(resources) {
        return resources.reduce((result, resource) => {
            return result.then(() => {
                if (resource instanceof Resource) {
                    let id = resource.getIdentifier();
                    this.emit('resourceremoved', {
                        registry: this,
                        resourceID: id
                    });
                    return this.dataCollection.remove(id);
                } else {
                    this.emit('resourceremoved', {
                        registry: this,
                        resourceID: resource
                    });
                    return this.dataCollection.remove(resource);
                }
            });
        }, Promise.resolve());
    }

    /**
     * Remove the specified resource from this registry.
     * @param {string|Resource} resource The resource to remove from this registry.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    remove(resource) {
        if (resource instanceof Resource) {
            let id = resource.getIdentifier();
            this.emit('resourceremoved', {
                registry: this,
                resourceID: id
            });
            return this.dataCollection.remove(id);
        } else {
            this.emit('resourceremoved', {
                registry: this,
                resourceID: resource
            });
            return this.dataCollection.remove(resource);
        }
    }

    /**
     * Return an object suitable for serialization.
     * @return {Object} An object suitable for serialization.
     */
    toJSON() {
        return {
            type: this.type,
            id: this.id,
            name: this.name
        };
    }

}

module.exports = Registry;
