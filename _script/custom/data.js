var Data = function () {

    // preload and transform datasets
    var me = {};

    var startYear;
    var endYear;
    var timeOutCount = 0;
    var maxTimeOutRetry = 3;

    var mines = {
        collection: {}, // holds the complete list of mines, not filtered
        clamped: {}, // holds the list of mines, filtered on year
        filtered: {list: [], ids: []}, // holds the final filtered of mines, filtered on year and all other filters
        pCodeIds: {} // matches pCodes to ids as the ids need to be te same even when the base filter changes
    };

    var minerals = [];
    var mineralLookup = {};
    var years = [];
    var yearsLookup = {};
    var projects = [];
    var projectsLookup = {};
    var armyGroups = [];
    var armyGroupLookup = {};
    var services = [];
    var servicesLookup = {};
    var pCodeCounter =0;

    var filterFunctionsLookup = {};

    var mineralColors = {
        "Gold": "#DAA520",
        "Diamond": "#4937A8",
        "Copper": "#D05D07",
        "Limestone": "#810051",
        "Salt": "#20A386"
    };


    var buildProperties = function (item, data) {
        item.properties.pcode = data.i;
        item.properties.name = data.n;
        item.properties.source = data.s;
        item.properties.location_origin = data.lo;
        item.properties.region = data.re;
        item.properties.district = data.di;
        item.properties.village = data.vi;
        item.properties.coop = data.cp;
        item.properties.qualification = 0;
		item.properties.type = data.t;
        item.properties.workergroup = 0;
        item.properties.visits = [];
    };


    me.init = function () {

        var checkpoint = new Date().getTime();
        var now;

        var dataDone = function () {
            if (mines.loaded) {
                now = new Date().getTime();
                console.log("datasets generated in " + (now - checkpoint) + "ms");

                EventBus.trigger(EVENT.preloadDone);
                TzaChart.render();
            }
        };

        function loadMines() {
            var url = "https://ipis.annexmap.net/api/data/"+Config.apiScope+"/all?key=ipis";

            FetchService.json(url, function (data,xhr) {

                if (!data){
                    console.error("Failed loading mines");
                    if (xhr.hasTimeOut){
                        timeOutCount++;
                        if (timeOutCount<maxTimeOutRetry){
                            UI.showLoaderTimeOut();
                            loadMines();
                        }else{
                            UI.showLoaderError();
                        }
                    }else{
                        UI.showLoaderError();
                    }
                }else{
                    now = new Date().getTime();
                    console.log("minedata loaded in " + (now - checkpoint) + "ms");
                    checkpoint = now;

                    armyGroups = [];
                    armyGroups.push({
                        label: "none",
                        value: 0
                    });

                    mines.baseData = data.result;
                    buildMineData(mines.collection);
                    buildMineData(mines.clamped);

                    mines.filtered.list = mines.collection.list.features;
                    mines.total=mines.collection.list.features.length;
                    armyGroups.sort(function (a, b) {
                        return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
                    });
                    mines.loaded = true;
                    dataDone();
                }
            });
        }


        loadMines();

    };

    function buildMineData(target) {

        target.list = featureCollection();
        target.lookup = {};
        target.properties = {};

        mines.baseData.forEach(function (d) {

            var passed = true;
            var date = d.d;
            if (date) {

                var year = parseInt(date.split("-")[0]);
                if (startYear && year<startYear) passed = false;
                if (endYear && year>endYear) passed = false;

                if (passed) {
                    var mine = target.lookup[d.i];
                    if (!mine) {

                        var mineId = mines.pCodeIds[d.i];
                        if (!mineId){
                            pCodeCounter++;
                            mines.pCodeIds[d.i] = pCodeCounter;
                            mineId = pCodeCounter;
                        }
                        mine = featurePoint(d.lt, d.ln);
                        mine.properties.id = mineId;
                        mines.filtered.ids.push(mineId);
                        buildProperties(mine, d);

                        target.list.features.push(mine);
                        target.lookup[d.i] = mine;
                        target.properties[mineId] = mine.properties;
                    }

                    mine.properties.mineral = d.m1;
                    mine.properties.picture = d.pi;


                    var workers = isNaN(parseInt(d.w)) ? -1 : parseInt(d.w);
                    if (isNaN(workers)) {
                        console.error("Workers NAN: " + d.w);
                        workers = -1;
                    }

                    var visit = {
                        date: date,
                        visit_onsite: d.vo,
                        workers: workers,
                        hasWorkers: workers >= 0,
                        pits: d.p,
                        pitsType: d.pt,
                        depth: d.dp,
                        // soil: d.sl,
                        qualification: d.q,
                        source: d.s,
                        project: d.pj,
                        coop: d.cp,
                        minerals: [],
                        services: [],
						mineralRoutes: [],
                        health: {},
                        socio: {},
                        mercury: d.m == "No" ? 1 : d.m == "Yes" ? 2 : 0,
                        oreamalgamation: d.om,
                        openair: d.oa,
                        openairclosetoresidential: d.or,
                        cyanide: d.c == "No" ? 1 : d.c == "Yes" ? 2 : 0,
                        cyanidetailings: d.cd
                    };

                    for (var i = 1; i < 4; i++) {
                        var mineral = d["m" + i];
                        if (mineral) {
                            visit.minerals.push(mineral);

                            if (!mineralLookup[mineral]) {
                                minerals.push(mineral);
                                mineralLookup[mineral] = true;
                            }
                            visit.mineralRoutes.push({
                                mineral: mineral,
                                color: mineralColors[mineral],
                                sellingPoint: d["m" + i + "sp"],
                                finalDestination: d["m" + i + "fd"]
                            });
                        }
                    }


                    // services
                    for (i = 1; i<5; i++){
                      if (d["s" + i])visit.services.push(d["s" + i]);
                    }
                    var phone = d.ph;
                    if (phone){
                      phone = "<b>Couverture téléphonique</b>: " + phone;
                      if (d.pc) phone += " (<small>" + d.pc + "</small>)";
                      visit.services.push(phone);
                    }

                    // health
                    visit.health = {
                        facilities: d.sf,
						wounded: d.aw,
						woundedcauses: d.ac,
						killed: d.ak,
						killedcauses: d.a2,
                        workerwomen: d.ww,
                        womenactivitiesmining: d.wa,
                        workerchildunder15: d.cu,
                        childunder15activitiesmining: d.cua,
                        childunder15nonmining: d.cn,
                        childunder15activitiesnonmining: d.cna
                    };

                    // socio
					visit.socio = {
						workers: workers,
                        workerwomen: d.ww,
						womenactivitiesmining: d.wa,
						closetoresidential: d.cr,
						csr: d.csr,
						buildingtype: d.bt,
						camponesite: d.cs,
						peoplelivingincamp: d.pc,
						liveincampwith: d.lc,
						incidents: d.in
					};

					// services
					visit.services = [];
					for (i = 1; i < 4; i++) {
						var service = d["s" + i + "n"];
						if (service) {
							visit.services.push({
                                service: service,
                                frequency: d["s" + i + "f"],
                                purpose: d["s" + i + "p"]
                            });
						}
					}

                    mine.properties.visits.push(visit);


                    // years, visits and properties latest visit
                    if (!mine.lastVisit || date > mine.lastVisit) {
                        mine.properties.year = year;
                        mine.lastVisit = date;

                        if (!yearsLookup[year]) {
                            years.push(year);
                            yearsLookup[year] = true;
                        }

                        mine.properties.minerals = visit.minerals;

                        // armed presence
                        mine.properties.armygroups = [];
                        mine.properties.armies = [];
                        for (i = 1; i < 3; i++) {
                            var army = d["a" + i];

                            var armyType = d["a" + i + "y"];
                            if (armyType === "0") armyType = 0;
                            var armygroupId = 0;
                            if (armyType) {
                                var armyGroup = armyGroupLookup[armyType];
                                if (!armyGroup) {
                                    armyGroup = {
                                        label: armyType,
                                        value: armyGroups.length + 1
                                    };
                                    armyGroups.push(armyGroup);
                                    armyGroupLookup[armyType] = armyGroup;
                                }
                                armygroupId = armyGroup.value;
                            }

                            if (armygroupId) {
                                mine.properties.armies.push(army);
                                mine.properties.armygroups.push(armygroupId);
                                if (i === 1) mine.properties.army = army;
                            }
                        }
                        // also filter on "no army presence"
                        if (mine.properties.armygroups.length === 0) mine.properties.armygroups.push(0);

                        // workers
                        if (workers >= 0) {
                            mine.properties.workers = workers;
                            var workergroup = 0;
                            if (workers > 50) workergroup = 1;
                            if (workers >= 250) workergroup = 2;
                            if (workers >= 500) workergroup = 3;
                            mine.properties.workergroup = workergroup;
                        }

                        // main mine services
                        mine.properties.services = []; // do we only include services from the last visit?
                        for (i = 1; i < 4; i++) {
                            var service = d["s" + i + "n"];
                            if (service) {
                                if (!servicesLookup[service]) {
                                    services.push(service);
                                    servicesLookup[service] = services.length;
                                }
                                var serviceId = servicesLookup[service];
                                mine.properties.services.push(serviceId);
                            }
                        }

						mine.properties.types = [];
                        if (d.t){
                            if (d.t == "Mine site, Processing site") mine.properties.types.push(2);
                            if (d.t == "Mine site") mine.properties.types.push(0);
                            if (d.t == "Processing site") mine.properties.types.push(1);
                        }

                        // mercury
                        mine.properties.mercury = 0;
                        if (d.m == 0) mine.properties.mercury = 1;
                        if (d.m == "No") mine.properties.mercury = 1;
                        if (d.m == 1) mine.properties.mercury = 2;
                        if (d.m == "Yes") mine.properties.mercury = 2;
                        
						// cyanide
						mine.properties.cyanide = 0;
						if (d.c == "No") mine.properties.cyanide = 1;
						if (d.c == "Yes") mine.properties.cyanide = 2;


						// killed and wounded
						mine.properties.haswounded = d.aw>0 ? 1 : 0;
						mine.properties.haskilled = d.ak>0 ? 1: 0;

                        // projects
                        if (d.pj) {
                            mine.properties.project = d.pj;
                            if (!projectsLookup[d.pj]) {
                                projects.push(d.pj);
                                projectsLookup[d.pj] = true;
                            }
                        }
                    }
                }

            }

        });
    }


    function featureCollection() {
        return {
            "type": "FeatureCollection",
            "features": []
        }
    }

    function featurePoint(lat, lon) {
        return {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        }
    }

    me.updateFilter = function (filter, item) {

        var values = [];
        filter.filterItems.forEach(function (item) {
            if (item.checked) values.push(item.value);
        });

        if (values.length === filter.filterItems.length) {
            // all items checked - ignore filter
            filterFunctionsLookup[filter.id] = undefined;
        } else {
            if (filter.array) {
                filterFunctionsLookup[filter.id] = function (item) {
                    var value = item.properties[filter.filterProperty];
                    if (value && value.length) {
                        return value.some(function (v) {
                            return values.includes(v);
                        });
                    }
                    return false;
                };
            } else {
                filterFunctionsLookup[filter.id] = function (item) {
                    return values.includes(item.properties[filter.filterProperty]);
                };
            }
        }

        me.filterMines();
    };

    me.filterMines = function () {

        mines.filtered.list = [];
        mines.filtered.ids = [];
        var filterFunctions = [];

        for (var key in  filterFunctionsLookup) {
            if (filterFunctionsLookup.hasOwnProperty(key) && filterFunctionsLookup[key]) {
                filterFunctions.push(filterFunctionsLookup[key]);
            }
        }

        mines.clamped.list.features.forEach(function (mine) {
            var passed = true;
            var filterCount = 0;
            var filterMax = filterFunctions.length;
            while (passed && filterCount < filterMax) {
                passed = filterFunctions[filterCount](mine);
                filterCount++;
            }
            if (passed) {
                mines.filtered.list.push(mine);
                mines.filtered.ids.push(mine.properties.id);
            }
        });

        // filter specs
        // see https://www.mapbox.com/mapbox-gl-js/style-spec/#types-filter
        // performance tests indicate that the fastest way to combine multiple filters is to
        // generate an array with all the matching id's and have only 1 filter of type "id in array"
        map.setFilter("mines", ['in', 'id'].concat(mines.filtered.ids));

        EventBus.trigger(EVENT.filterChanged);
    };

    me.getMines = function () {
        return mines.collection.list;
    };

    me.getMinesTotal = function () {
        return mines.total;
    };

    me.getFilteredMines = function () {
        return mines.filtered.list;
    };

    me.getYearClamp = function () {
        return {start:startYear,end:endYear};
    };

    me.getMineDetail = function (mine) {
        // hmmm... don't use mine directly: apparently mapbox stores the features as shallow copies.

        var p = mines.collection.properties[mine.properties.id];

        if (!p.hasDetail) {
            p.mineralString = p.minerals.join(", ");

            p.fLongitude = decimalToDegrees(mine.geometry.coordinates[0], "lon");
            p.fLatitude = decimalToDegrees(mine.geometry.coordinates[1], "lat");

            var dates = [];

            var infoYears = [];
            var infoData = {};
            var servicesYears = [];
            var servicesData = {};
            var healthYears = [];
            var healthData = {};
			var socioYears = [];
			var socioData = {};
            var substanceYears = [];
            var substanceData = {};


            p.visits.forEach(function (visit) {
                var parts = visit.date.split("-");
                var year = parts[0];
                visit.formattedDate = parts[2] + "/" + parts[1] + "/" + parts[0];
                visit.mineralString = visit.minerals.join(", ");

                var visitDateProject = Template.render("visitDateProject", visit);

                if (visit.mercury === 1) visit.mercuryString = "No";
                if (visit.mercury === 2) visit.mercuryString = "Yes";
                visit.hasmercury = visit.mercury == 2;
                if (visit.cyanide === 1) visit.cyanideString = "No";
                if (visit.cyanide === 2) visit.cyanideString = "Yes";
                visit.hascyanide = visit.cyanide == 2;

                var hasYear;

                hasYear = infoYears.indexOf(year) >= 0;
                if (!hasYear) {
                    infoYears.push(year);
                    infoData[year] = "";
                }
                infoData[year] += Template.render("visitDetail", visit);

                if (visit.services.length) {
                    hasYear = servicesYears.indexOf(year) >= 0;
                    if (!hasYear) {
                        servicesYears.push(year);
                        servicesData[year] = "";
                    }

                    servicesData[year] += visitDateProject + Template.render("servicesdetail", visit.services);
                }

                // health
                var hasHealth = false;
                for (var key in visit.health) {
                    if (visit.health.hasOwnProperty(key) && visit.health[key] && visit.health[key] != "---") hasHealth = true;
                }
                if (hasHealth) {
                    hasYear = healthYears.indexOf(year) >= 0;
                    if (!hasYear) {
                        healthYears.push(year);
                        healthData[year] = "";
                    }
                    healthData[year] += visitDateProject + Template.render("healthDetail", visit.health);
                }

				// socio
				var hasSocio = false;
				for (var key in visit.socio) {
					if (visit.socio.hasOwnProperty(key) && visit.socio[key] && visit.socio[key] != "---") hasSocio = true;
				}

				if (hasSocio) {
					hasYear = socioYears.indexOf(year) >= 0;
					if (!hasYear) {
						socioYears.push(year);
						socioData[year] = "";
					}
					socioData[year] += visitDateProject + Template.render("socioDetail", visit.socio);
				}


                if (visit.mineralRoutes.length) {
                    hasYear = substanceYears.indexOf(year) >= 0;
                    if (!hasYear) {
                        substanceYears.push(year);
                        substanceData[year] = "";
                    }

                    substanceData[year] += visitDateProject + Template.render("substancesdetail", visit);
                }

            });

            p.infoTab = "No data";
            if (infoYears.length) {
                p.infoYears = [];
                infoYears.forEach(function (year, index) {
                    p.infoYears.unshift({
                        year: year,
                        id: index,
                        data: infoData[year]
                    })
                });
                p.infoTab = Template.render("yearlist", p.infoYears)
            }

            p.servicesTab = "No data";
            if (servicesYears.length) {
                p.servicesYears = [];
                servicesYears.forEach(function (servicesYear, index) {
                    p.servicesYears.unshift({
                        year: servicesYear,
                        id: index,
                        data: servicesData[servicesYear]
                    })
                });

                p.servicesTab = Template.render("yearlist", p.servicesYears)
            }

            p.healthTab = "No data";
            if (healthYears.length) {
                p.healthYears = [];
				healthYears.forEach(function (year, index) {
                    p.healthYears.unshift({
                        year: year,
                        id: index,
                        data: healthData[year]
                    })
                });

                p.healthTab = Template.render("yearlist", p.healthYears)
            }

			p.socioTab = "No data";
			if (socioYears.length) {
				p.socioYears = [];
				socioYears.forEach(function (year, index) {
					p.socioYears.unshift({
						year: year,
						id: index,
						data: socioData[year]
					})
				});

				p.socioTab = Template.render("yearlist", p.socioYears)
			}

            p.substancesTab = "No Data";
            if (substanceYears.length) {
                p.substanceYears = [];
                substanceYears.forEach(function (substanceYear, index) {
                    p.substanceYears.unshift({
                        year: substanceYear,
                        id: index,
                        data: substanceData[substanceYear]
                    })
                });

                p.substancesTab = Template.render("yearlist", p.substanceYears)
            }


            p.hasDetail = true;
        }

        return p;
    };

    me.getYears = function () {
        return years;
    };

    me.getMinerals = function () {
        var result = [];

        var order = ["Gold", "Diamond", "Salt", "Limestone", "Copper"].reverse();

        minerals.forEach(function (mineral) {
            result.push({
                label: mineral,
                value: mineral,
                color: mineralColors[mineral] || "grey",
                index: order.indexOf(mineral)
            })
        });

        return result.sort(function (a, b) {
            return a.index < b.index ? 1 : -1;
        });

    };

    me.getArmyGroups = function () {
        var result = armyGroups;

        var order = ["Pas de présence armée constatée", "FARDC - Pas de données sur les ingérences", "FARDC - Pas d’ingérence constatée", "FARDC - Éléments indiciplinés", "Groupe armé local", "Groupe armé étranger"].reverse();

        result.forEach(function (arm) {
            arm.index = order.indexOf(arm.label)
        });

        return result.sort(function (a, b) {
            return a.index < b.index ? 1 : -1;
        });

    };

    me.getServices = function () {
        var result = [];

        var order = ["RMO", "Village", "District", "NEMC", "OSHA", "TRA", "Forest services", "Food and drugs authority", "Police", "Immigration"].reverse();

        services.forEach(function (item) {
            result.push({label: item, value: servicesLookup[item], index: order.indexOf(item)})
        });

        // temporary filter to make the list of state services only contain main services
        //result = result.filter(function(i){return order.indexOf(i.label) > -1});

        return result.sort(function (a, b) {
            return a.index < b.index ? 1 : -1;
        });

    };

    me.getProjects = function () {
        return projects.reverse().sort(function (a, b) {
            return a.indexOf('status') >= 0;
        });
    };




    me.getColorForMineral = function (mineral) {
        return mineralColors[mineral] || "grey";
    };

    me.updateYearFilter = function (start, end) {
        startYear = start;
        endYear = end;

        if (Config.layers.visits.added){
			buildMineData(mines.clamped);
			me.filterMines();
        }
        if (Config.layers.roadblocks.added) me.filterRoadBlocks();
        if (Config.layers.tradelines.added) me.filterTradelines();

    };


    return me;


}();
